import { PaymentStatus } from '@models/responses/payment/payment-response';

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ausstehend',
  REQUIRES_PAYMENT: 'Zahlung ausstehend',
  REQUIRES_CARD_VERIFICATION: 'Kartenprüfung ausstehend',
  SUCCEEDED: 'Bezahlt',
  FAILED: 'Fehlgeschlagen',
  FREE: 'Kostenlos',
  REFUNDED: 'Erstattet',
  PARTIALLY_REFUNDED: 'Teilweise erstattet'
};

export function getPaymentStatusLabel(status: PaymentStatus | string): string {
  return PAYMENT_STATUS_LABELS[status] ?? status;
}
