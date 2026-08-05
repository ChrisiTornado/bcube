package com.bcube.userservice.service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** Sent by payment-service, which only knows the paying user's id - the controller resolves the user itself. */
@Data
public class RefundNotificationRequest {
    @NotNull
    private Long userId;

    @NotBlank
    private String studioName;

    @NotBlank
    private String amount;
}
