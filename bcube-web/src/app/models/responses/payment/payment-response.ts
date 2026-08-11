export type PaymentStatus =
    | 'PENDING'
    | 'REQUIRES_PAYMENT'
    | 'REQUIRES_CARD_VERIFICATION'
    | 'SUCCEEDED'
    | 'FAILED'
    | 'FREE'
    | 'REFUNDED'
    | 'PARTIALLY_REFUNDED';

export interface PaymentResponse {
    id: number;
    bookingId: number;
    userId: number;
    studioId: number;
    hourlyRateCentsSnapshot: number;
    durationHours: number;
    baseAmountCents: number;
    discountAmountCents: number;
    finalAmountCents: number;
    currency: string;
    status: PaymentStatus;
    clientSecret: string | null;
    refundedAmountCents: number;
    studioName: string | null;
    bookingDate: string | null;
    createdAt: string;
    invoiceNumber: string | null;
}
