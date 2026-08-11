import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import { AuthService } from '@core/services/auth.service';
import { PaymentService } from '@features/payments/payment.service';
import { PaymentResponse } from '@models/responses/payment/payment-response';
import { LoadingSpinnerComponent } from '@shared/ui/loading-spinner/loading-spinner.component';
import { DARK_BUTTON_STYLE, LIGHT_BUTTON_STYLE } from '@shared/util/button-style';
import { getPaymentStatusLabel } from '@shared/util/payment-status.util';
import { getDashboardBasePath } from '@shared/util/dashboard-path.util';
import { extractErrorMessage } from '@shared/util/error-message.util';

@Component({
    selector: 'app-payment-history-view',
    imports: [CommonModule, TableModule, ButtonModule, LoadingSpinnerComponent],
    templateUrl: './payment-history-view.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './payment-history-view.component.css'
})
export class PaymentHistoryViewComponent implements OnInit {
  readonly darkButtonStyle = DARK_BUTTON_STYLE;
  readonly lightButtonStyle = LIGHT_BUTTON_STYLE;
  readonly size = 10;

  payments: PaymentResponse[] = [];
  loading = false;
  page = 0;
  totalPages = 0;
  downloadingInvoiceId: number | null = null;

  constructor(
    private paymentService: PaymentService,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPage(0);
  }

  goBack(): void {
    const basePath = getDashboardBasePath(this.authService.isAdmin());
    this.router.navigate([`${basePath}/profile`]);
  }

  loadPage(page: number): void {
    const userId = this.authService.getUser()?.id;
    if (!userId) return;

    this.loading = true;
    this.paymentService.getHistory(userId, page, this.size)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: res => {
          this.payments = res.content;
          this.totalPages = res.totalPages;
          this.page = page;
        },
        error: (err: HttpErrorResponse) => {
          this.messageService.add({
            key: 'main',
            severity: 'error',
            summary: 'Fehler',
            detail: extractErrorMessage(err, 'Zahlungen konnten nicht geladen werden.')
          });
        }
      });
  }

  getStatusLabel(status: string): string {
    return getPaymentStatusLabel(status);
  }

  formatAmount(cents: number): string {
    return new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
  }

  downloadInvoice(payment: PaymentResponse): void {
    if (!payment.invoiceNumber || this.downloadingInvoiceId) return;

    this.downloadingInvoiceId = payment.id;
    this.paymentService.downloadInvoice(payment.id)
      .pipe(finalize(() => this.downloadingInvoiceId = null))
      .subscribe({
        next: blob => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${payment.invoiceNumber}.pdf`;
          link.click();
          URL.revokeObjectURL(url);
        },
        error: (err: HttpErrorResponse) => {
          this.messageService.add({
            key: 'main',
            severity: 'error',
            summary: 'Fehler',
            detail: extractErrorMessage(err, 'Rechnung konnte nicht heruntergeladen werden.')
          });
        }
      });
  }
}
