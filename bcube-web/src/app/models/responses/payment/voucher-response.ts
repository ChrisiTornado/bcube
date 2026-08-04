export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_HOURS';

export interface VoucherResponse {
    id: number;
    code: string;
    name: string;
    discountType: DiscountType;
    discountPercentage: number | null;
    discountAmountCents: number | null;
    discountHours: number | null;
    maxRedemptionsPerUser: number;
    maxRedemptionsTotal: number | null;
    expiresAt: string | null;
    active: boolean;
    requiresCardVerification: boolean;
    createdAt: string;
}
