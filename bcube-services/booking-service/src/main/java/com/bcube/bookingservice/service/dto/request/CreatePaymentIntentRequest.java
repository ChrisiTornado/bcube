package com.bcube.bookingservice.service.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@AllArgsConstructor
public class CreatePaymentIntentRequest {
    private Long bookingId;
    private Long userId;
    private Long studioId;
    private Integer hourlyRateCents;
    private BigDecimal durationHours;
    private String currency;
    private String studioName;
    private LocalDate bookingDate;
    private String voucherCode;
}
