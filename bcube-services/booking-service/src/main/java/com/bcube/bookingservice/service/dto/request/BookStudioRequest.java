package com.bcube.bookingservice.service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class BookStudioRequest {
    @NotNull
    private Long userID;
    @NotNull
    private Long studioID;
    @NotNull
    private Long smartlockID;
    @NotBlank
    private String date;
    @NotBlank
    private String startTime;
    @NotBlank
    private String endTime;
    private String voucherCode;
}
