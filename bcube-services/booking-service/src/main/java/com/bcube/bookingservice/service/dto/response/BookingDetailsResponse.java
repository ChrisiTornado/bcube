package com.bcube.bookingservice.service.dto.response;

import com.bcube.bookingservice.persistance.entity.BookingStatus;
import com.bcube.bookingservice.service.dto.Classes.StudioDto;
import com.bcube.bookingservice.service.dto.Classes.UserDto;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;

@Data
@AllArgsConstructor
public class BookingDetailsResponse {
    private Long id;
    private UserDto user;
    private StudioDto studio;
    private LocalDate date;
    private Instant startTime;
    private Instant endTime;
    private BookingStatus status;

    private String accessCode;
}
