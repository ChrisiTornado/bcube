package com.bcube.bookingservice.service.dto.response;

import com.bcube.bookingservice.persistance.entity.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Public, anonymous view of a studio's occupancy - deliberately carries no booking id, user or
 * studio data, so guests browsing a studio's calendar only ever learn *when* it is taken.
 */
@Data
@AllArgsConstructor
public class BookedSlotResponse {
    private LocalDate date;
    private Instant startTime;
    private Instant endTime;
    private BookingStatus status;
}
