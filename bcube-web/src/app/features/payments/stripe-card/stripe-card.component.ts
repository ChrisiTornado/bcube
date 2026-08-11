import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { loadStripe, Stripe, StripeCardElement, StripeElements } from '@stripe/stripe-js';
import { ButtonModule } from 'primeng/button';
import { environment } from '@environments/environment';

// TODO: SetupIntent-based saved cards - deferred, see plan's "explicitly deferred" list.

@Component({
    selector: 'app-stripe-card',
    imports: [ButtonModule],
    templateUrl: './stripe-card.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './stripe-card.component.css'
})
export class StripeCardComponent implements OnInit, OnDestroy {
  @Input({ required: true }) clientSecret!: string;
  @Input() submitLabel = 'Bezahlen';
  // 'setup' verifies+fingerprints a card via a SetupIntent without charging it - used for
  // requiresCardVerification vouchers (welcome voucher) redeeming to a FREE booking.
  @Input() mode: 'payment' | 'setup' = 'payment';

  @Output() paymentSucceeded = new EventEmitter<void>();
  @Output() paymentFailed = new EventEmitter<string>();

  @ViewChild('cardElement') cardElementRef!: ElementRef<HTMLDivElement>;

  submitting = false;
  cardError: string | null = null;
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private card: StripeCardElement | null = null;

  async ngOnInit(): Promise<void> {
    this.stripe = await loadStripe(environment.stripePublishableKey);
    if (!this.stripe) {
      this.cardError = 'Zahlungsformular konnte nicht geladen werden.';
      return;
    }

    this.elements = this.stripe.elements();
    // Stripe Elements renders into its own isolated iframe, so our app's dark theme CSS
    // never reaches it - without an explicit style here it falls back to black-on-transparent,
    // which is invisible against our dark background.
    this.card = this.elements.create('card', {
      hidePostalCode: true,
      style: {
        base: {
          color: '#ffffff',
          fontSize: '16px',
          '::placeholder': { color: 'rgba(255, 255, 255, 0.45)' },
          iconColor: '#ffffff'
        },
        invalid: {
          color: '#f38b8b',
          iconColor: '#f38b8b'
        }
      }
    });
    this.card.mount(this.cardElementRef.nativeElement);
    this.card.on('change', event => {
      this.cardError = event.error ? event.error.message : null;
    });
  }

  ngOnDestroy(): void {
    this.card?.destroy();
  }

  async confirmPayment(): Promise<void> {
    if (!this.stripe || !this.card || this.submitting) return;

    this.submitting = true;
    this.cardError = null;

    const result = this.mode === 'setup'
      ? await this.stripe.confirmCardSetup(this.clientSecret, { payment_method: { card: this.card } })
      : await this.stripe.confirmCardPayment(this.clientSecret, { payment_method: { card: this.card } });

    this.submitting = false;

    if (result.error) {
      this.cardError = result.error.message ?? 'Zahlung fehlgeschlagen.';
      this.paymentFailed.emit(this.cardError);
      return;
    }

    const status = this.mode === 'setup'
      ? (result as { setupIntent?: { status: string } }).setupIntent?.status
      : (result as { paymentIntent?: { status: string } }).paymentIntent?.status;

    if (status === 'succeeded' || status === 'processing') {
      this.paymentSucceeded.emit();
    } else {
      this.cardError = 'Zahlung konnte nicht bestätigt werden.';
      this.paymentFailed.emit(this.cardError);
    }
  }
}
