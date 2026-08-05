package com.bcube.bookingservice.service.dto.request;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class AdminBookingQueryRequest {
    private int page = 0;
    private int size = 10;
    private Long userId;
    private Long studioId;
    private String sortBy;
    private String sortDirection;
}
