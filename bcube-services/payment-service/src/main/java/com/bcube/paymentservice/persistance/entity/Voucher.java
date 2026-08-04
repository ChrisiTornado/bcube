package com.bcube.paymentservice.persistance.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "vouchers")
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class Voucher {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false)
    private DiscountType discountType;

    // Only one of these three is populated, matching discountType - three purpose-named
    // nullable columns instead of one overloaded "value" column.
    @Column(name = "discount_percentage")
    private Integer discountPercentage;

    @Column(name = "discount_amount_cents")
    private Integer discountAmountCents;

    @Column(name = "discount_hours")
    private BigDecimal discountHours;

    @Builder.Default
    @Column(name = "max_redemptions_per_user", nullable = false)
    private Integer maxRedemptionsPerUser = 1;

    @Column(name = "max_redemptions_total")
    private Integer maxRedemptionsTotal;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @Builder.Default
    @Column(name = "requires_card_verification", nullable = false)
    private boolean requiresCardVerification = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.code = this.code.toUpperCase();
    }
}
