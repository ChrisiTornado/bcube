package com.bcube.paymentservice.service.dto.request;

import com.bcube.paymentservice.persistance.entity.DiscountType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateVoucherRequest {
    @NotBlank
    private String code;

    @NotBlank
    private String name;

    @NotNull
    private DiscountType discountType;

    @Min(1)
    @Max(100)
    private Integer discountPercentage;

    @Positive
    private Integer discountAmountCents;

    @Positive
    private BigDecimal discountHours;

    @NotNull
    @Positive
    private Integer maxRedemptionsPerUser;

    @Positive
    private Integer maxRedemptionsTotal;

    private Instant expiresAt;

    @NotNull
    private Boolean requiresCardVerification;
}
