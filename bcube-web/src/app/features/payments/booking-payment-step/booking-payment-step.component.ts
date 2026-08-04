import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { finalize } from 'rxjs';
import { Studio } from '@models/studio.model';
import { BookingDetailsResponse } from '@models/responses/booking/booking-details-response';
import { VoucherPreviewResponse } from '@models/responses/payment/voucher-preview-response';
import { VoucherResponse } from '@models/responses/payment/voucher-response';
import { BookingService } from '@features/bookings/booking.service';
import { PaymentService } from '@features/payments/payment.service';
import { StripeCardComponent } from '@features/payments/stripe-card/stripe-card.component';
import { extractErrorMessage } from '@shared/util/error-message.util';

type PaymentStepState = 'confirm' | 'card' | 'polling';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 15000;

@Component({
    selector: 'app-booking-payment-step',
    imports: [ButtonModule, InputTextModule, FormsModule, StripeCardComponent],
    templateUrl: './booking-payment-step.component.html',
    styleUrl: './booking-payment-step.component.css'
})
export class BookingPaymentStepComponent implements OnInit, OnChanges {
  @Input({ required: true }) studio!: Studio;
  @Input({ required: true }) times!: { startTime: Date; endTime: Date };
  @Input({ required: true }) userId!: number;
  @Input() booking: BookingDetailsResponse | null = null;
  @Input() creating = false;

  @Output() confirmClicked = new EventEmitter<string | undefined>();
  @Output() paymentConfirmed = new EventEmitter<number>();
  @Output() paymentFailed = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  state: PaymentStepState = 'confirm';
  pollError: string | null = null;

  voucherCode = '';
  voucherPreview: VoucherPreviewResponse | null = null;
  voucherError: string | null = null;
  validatingVoucher = false;
  availableVouchers: VoucherResponse[] = [];

  constructor(private bookingService: BookingService, private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.paymentService.getMyAvailableVouchers(this.userId).subscribe({
      next: vouchers => this.availableVouchers = vouchers,
      // A vouchers-lookup failure shouldn't block the booking flow - the manual code input still works.
      error: () => this.availableVouchers = []
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['booking'] && this.booking?.clientSecret) {
      this.state = 'card';
    }
  }

  /** amountDueCents===0 with a clientSecret still present means this is a card-verification-only
   * SetupIntent (requiresCardVerification voucher), not a real charge. */
  get isSetupVerification(): boolean {
    return this.booking?.amountDueCents === 0;
  }

  get durationHours(): number {
    return (this.times.endTime.getTime() - this.times.startTime.getTime()) / 3_600_000;
  }

  get baseAmountCents(): number {
    return Math.round((this.studio.hourlyRateCents ?? 0) * this.durationHours);
  }

  get amountCents(): number {
    return this.voucherPreview?.finalAmountCents ?? this.baseAmountCents;
  }

  formatAmount(cents: number): string {
    return new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
  }

  applyVoucher(): void {
    const code = this.voucherCode.trim();
    if (!code || this.validatingVoucher) return;

    this.validatingVoucher = true;
    this.voucherError = null;

    this.paymentService.validateVoucher(code, this.userId, this.studio.hourlyRateCents, this.durationHours)
      .pipe(finalize(() => this.validatingVoucher = false))
      .subscribe({
        next: preview => this.voucherPreview = preview,
        error: err => {
          this.voucherPreview = null;
          this.voucherError = extractErrorMessage(err, 'Gutschein konnte nicht angewendet werden.');
        }
      });
  }

  removeVoucher(): void {
    this.voucherCode = '';
    this.voucherPreview = null;
    this.voucherError = null;
  }

  applyVoucherChip(voucher: VoucherResponse): void {
    this.voucherCode = voucher.code;
    this.applyVoucher();
  }

  confirmBooking(): void {
    this.confirmClicked.emit(this.voucherPreview ? this.voucherCode.trim() : undefined);
  }

  onCardSucceeded(): void {
    if (!this.isSetupVerification) {
      this.state = 'polling';
      this.pollError = null;
      this.pollBookingStatus(Date.now());
      return;
    }

    // SetupIntent succeeded client-side - now ask payment-service to fingerprint-check the
    // card server-side and grant access if it hasn't already been used for this voucher.
    this.state = 'polling';
    this.pollError = null;

    this.paymentService.confirmCardVerification(this.booking!.id).subscribe({
      next: () => this.pollBookingStatus(Date.now()),
      error: err => {
        this.pollError = extractErrorMessage(err, 'Kartenprüfung fehlgeschlagen.');
        this.paymentFailed.emit(this.pollError);
      }
    });
  }

  onCardFailed(message: string): void {
    this.paymentFailed.emit(message);
  }

  private pollBookingStatus(startedAt: number): void {
    if (!this.booking) return;

    this.bookingService.getBookingById(this.booking.id).subscribe({
      next: details => {
        if (details.status === 'CONFIRMED') {
          this.paymentConfirmed.emit(this.booking!.id);
          return;
        }

        if (details.status === 'FAILED') {
          this.pollError = 'Die Zahlung konnte nicht bestätigt werden.';
          this.paymentFailed.emit(this.pollError);
          return;
        }

        this.scheduleNextPoll(startedAt);
      },
      error: () => this.scheduleNextPoll(startedAt)
    });
  }

  private scheduleNextPoll(startedAt: number): void {
    if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
      this.pollError = 'Die Bestätigung dauert länger als erwartet. Bitte prüfe deine Buchungen in Kürze erneut.';
      this.paymentFailed.emit(this.pollError);
      return;
    }

    setTimeout(() => this.pollBookingStatus(startedAt), POLL_INTERVAL_MS);
  }
}
