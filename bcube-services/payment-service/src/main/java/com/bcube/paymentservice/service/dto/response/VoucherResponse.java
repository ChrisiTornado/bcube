package com.bcube.paymentservice.service.dto.response;

import com.bcube.paymentservice.persistance.entity.DiscountType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VoucherResponse {
    private Long id;
    private String code;
    private String name;
    private DiscountType discountType;
    private Integer discountPercentage;
    private Integer discountAmountCents;
    private BigDecimal discountHours;
    private Integer maxRedemptionsPerUser;
    private Integer maxRedemptionsTotal;
    private Instant expiresAt;
    private boolean active;
    private boolean requiresCardVerification;
    private Instant createdAt;
}
