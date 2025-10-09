package com.bcube.bookingservice.service.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class BookStudioRequest {
    private Long userID;
    private Long studioID;
    private String date;
    private String startTime;
    private String endTime;
}