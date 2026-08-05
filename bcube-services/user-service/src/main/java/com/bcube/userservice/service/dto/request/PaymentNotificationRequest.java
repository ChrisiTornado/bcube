package com.bcube.userservice.service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Sent by payment-service, which only knows the paying user's id (not their email) - the
 * controller resolves the user itself via UserRepository. Shared by /payment-succeeded and
 * /payment-failed; amount is ignored (may be null) for the failed case.
 */
@Data
public class PaymentNotificationRequest {
    @NotNull
    private Long userId;

    @NotBlank
    private String studioName;

    @NotBlank
    private String date;

    private String amount;
}
