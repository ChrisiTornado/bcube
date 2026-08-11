package com.bcube.paymentservice.service.dto.response;

import com.bcube.paymentservice.persistance.entity.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private Long id;
    private Long bookingId;
    private Long userId;
    private Long studioId;
    private Integer hourlyRateCentsSnapshot;
    private BigDecimal durationHours;
    private Integer baseAmountCents;
    private Integer discountAmountCents;
    private Integer finalAmountCents;
    private String currency;
    private PaymentStatus status;
    private String clientSecret;
    private Integer refundedAmountCents;
    private String studioName;
    private LocalDate bookingDate;
    private Instant createdAt;
    private String invoiceNumber;
}
