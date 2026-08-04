package com.bcube.paymentservice.persistance.entity;

public enum PaymentStatus {
    PENDING,
    REQUIRES_PAYMENT,
    REQUIRES_CARD_VERIFICATION,
    SUCCEEDED,
    FAILED,
    FREE,
    REFUNDED,
    PARTIALLY_REFUNDED
}
