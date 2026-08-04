package com.bcube.paymentservice.persistance.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(
        name = "payments"
)
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_id", nullable = false)
    private Long bookingId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "studio_id", nullable = false)
    private Long studioId;

    @Column(name = "hourly_rate_cents_snapshot", nullable = false)
    private Integer hourlyRateCentsSnapshot;

    @Column(name = "duration_hours", nullable = false)
    private BigDecimal durationHours;

    @Column(name = "base_amount_cents", nullable = false)
    private Integer baseAmountCents;

    @Column(name = "discount_amount_cents", nullable = false)
    private Integer discountAmountCents;

    @Column(name = "final_amount_cents", nullable = false)
    private Integer finalAmountCents;

    @Column(name = "currency", nullable = false)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PaymentStatus status;

    @Column(name = "stripe_payment_intent_id")
    private String stripePaymentIntentId;

    @Column(name = "stripe_setup_intent_id")
    private String stripeSetupIntentId;

    @Column(name = "stripe_refund_id")
    private String stripeRefundId;

    @Builder.Default
    @Column(name = "refunded_amount_cents", nullable = false)
    private Integer refundedAmountCents = 0;

    @Column(name = "voucher_id")
    private Long voucherId;

    @Column(name = "studio_name")
    private String studioName;

    @Column(name = "booking_date")
    private LocalDate bookingDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
