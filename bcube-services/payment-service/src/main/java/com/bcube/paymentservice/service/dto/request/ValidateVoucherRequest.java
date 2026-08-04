package com.bcube.paymentservice.service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ValidateVoucherRequest {
    @NotBlank
    private String code;

    @NotNull
    private Long userId;

    @NotNull
    @Positive
    private Integer hourlyRateCents;

    @NotNull
    @Positive
    private BigDecimal durationHours;
}
