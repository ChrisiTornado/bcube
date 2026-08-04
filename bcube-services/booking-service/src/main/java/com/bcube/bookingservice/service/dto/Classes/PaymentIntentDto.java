package com.bcube.bookingservice.service.dto.Classes;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentIntentDto {
    private Long id;
    private String status;
    private String clientSecret;
    private Integer finalAmountCents;
}
