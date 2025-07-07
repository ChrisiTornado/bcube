package com.example.bcube.service.dto.response;

import com.example.bcube.persistence.entity.BookingStatus;
import com.example.bcube.persistence.entity.Studio;
import com.example.bcube.persistence.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;

@Data
@AllArgsConstructor
public class BookingResponse {
    private int id;
    private User user;
    private Studio studio;
    private LocalDate date;
    private Instant startTime;
    private Instant endTime;
    private BookingStatus status;
}
