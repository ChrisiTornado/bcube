package com.bcube.paymentservice.persistance.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "voucher_redemptions")
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class VoucherRedemption {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "voucher_id", nullable = false)
    private Long voucherId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "booking_id")
    private Long bookingId;

    @Column(name = "payment_id")
    private Long paymentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RedemptionStatus status;

    @Column(name = "granted_at", nullable = false)
    private Instant grantedAt;

    @Column(name = "redeemed_at")
    private Instant redeemedAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    // SHA-256 of the normalized phone number - populated for grant-time abuse checks
    // (welcome voucher, Phase 5). Not raw PII: data-minimization in a service that has no
    // other reason to hold it.
    @Column(name = "phone_hash")
    private String phoneHash;

    // Stripe card fingerprint - populated at redemption time for requiresCardVerification
    // vouchers (Phase 5). Stable for the same physical card across different Stripe Customers.
    @Column(name = "card_fingerprint")
    private String cardFingerprint;

    @PrePersist
    protected void onCreate() {
        if (this.grantedAt == null) {
            this.grantedAt = Instant.now();
        }
    }
}
