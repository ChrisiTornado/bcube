package com.bcube.bookingservice.service.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserBookingQueryRequest {
    private Long userId;
    private int page = 0;
    private int size = 10;

    private Long studioId;
}
