package com.bcube.userservice.service.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Shared by /api/notifications/booking-confirmed, /booking-cancelled and /booking-reminder.
 * refundNote is only ever populated for the cancelled case; the other two ignore it.
 */
@Data
public class BookingNotificationRequest {
    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String firstName;

    @NotBlank
    private String studioName;

    @NotBlank
    private String date;

    @NotBlank
    private String time;

    private String refundNote;
}
