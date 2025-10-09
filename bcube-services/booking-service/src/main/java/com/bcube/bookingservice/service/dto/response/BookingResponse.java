package com.bcube.bookingservice.service.dto.response;

import com.bcube.bookingservice.persistance.entity.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;

@Data
@AllArgsConstructor
public class BookingResponse {
    private Long id;
    private Long userId;
    private Long studioId;
    private LocalDate date;
    private Instant startTime;
    private Instant endTime;
    private BookingStatus status;
}