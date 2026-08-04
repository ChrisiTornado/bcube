package com.bcube.paymentservice.service.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreatePaymentIntentRequest {
    @NotNull
    private Long bookingId;

    @NotNull
    private Long userId;

    @NotNull
    private Long studioId;

    @NotNull
    @Positive
    private Integer hourlyRateCents;

    @NotNull
    @Positive
    private BigDecimal durationHours;

    @NotNull
    private String currency;

    private String studioName;

    private LocalDate bookingDate;

    private String voucherCode;
}
