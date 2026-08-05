package com.bcube.bookingservice.service.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class AdminBookingQueryRequest {
    @PositiveOrZero
    private int page = 0;
    @PositiveOrZero
    @Max(100)
    private int size = 10;
    private Long userId;
    private Long studioId;
    private String sortBy;
    private String sortDirection;
}
