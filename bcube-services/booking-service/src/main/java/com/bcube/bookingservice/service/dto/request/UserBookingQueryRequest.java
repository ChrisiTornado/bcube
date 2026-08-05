package com.bcube.bookingservice.service.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserBookingQueryRequest {
    private Long userId;
    @PositiveOrZero
    private int page = 0;
    @PositiveOrZero
    @Max(100)
    private int size = 10;
    private Long studioId;
    private String sortBy;
    private String sortDirection;
}
