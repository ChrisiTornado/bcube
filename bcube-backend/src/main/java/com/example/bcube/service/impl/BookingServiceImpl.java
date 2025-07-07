package com.example.bcube.service.impl;

import com.example.bcube.persistence.entity.Booking;
import com.example.bcube.persistence.entity.BookingStatus;
import com.example.bcube.persistence.entity.Studio;
import com.example.bcube.persistence.entity.User;
import com.example.bcube.persistence.repository.BookingRepository;
import com.example.bcube.persistence.repository.StudioRepository;
import com.example.bcube.persistence.repository.UserRepository;
import com.example.bcube.service.BookingService;
import com.example.bcube.service.dto.request.BookStudioRequest;
import com.example.bcube.service.dto.response.BookingResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {
    private final UserRepository userRepository;
    private final StudioRepository studioRepository;
    private final BookingRepository bookingRepository;

    @Override
    public BookingResponse[] getAllBookings() {
        return new BookingResponse[0];
    }

    @Override
    public BookingResponse bookTimeSlot(BookStudioRequest bookStudioRequest) {
        User user = userRepository.findById((long) bookStudioRequest.getUserID())
                .orElseThrow(() -> new IllegalArgumentException("User mit ID " + bookStudioRequest.getUserID() + " nicht gefunden"));

        Studio studio = studioRepository.findById((long) bookStudioRequest.getStudioID())
                .orElseThrow(() -> new IllegalArgumentException("Studio mit ID " + bookStudioRequest.getStudioID() + " nicht gefunden"));

        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd.MM.yyyy");
        LocalDate date = LocalDate.parse(bookStudioRequest.getDate(), dateFormatter);

        String startDateTimeString = bookStudioRequest.getDate() + "T" + bookStudioRequest.getStartTime() + ":00"; // z. B. "07.07.2025T13:15:00"
        String endDateTimeString = bookStudioRequest.getDate() + "T" + bookStudioRequest.getEndTime() + ":00";

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy'T'HH:mm:ss");
        LocalDateTime start = LocalDateTime.parse(startDateTimeString, formatter);
        LocalDateTime end = LocalDateTime.parse(endDateTimeString, formatter);

        // Konvertiere in UTC Instant
        Instant startTime = start.atZone(ZoneId.of("Europe/Vienna")).toInstant();
        Instant endTime = end.atZone(ZoneId.of("Europe/Vienna")).toInstant();

        Booking booking = Booking.builder()
                .user(user)
                .studio(studio)
                .date(date)
                .startTime(startTime)
                .endTime(endTime)
                .status(BookingStatus.CONFIRMED)
                .build();

        Booking saved = bookingRepository.save(booking);

        return new BookingResponse(
                saved.getId(),
                saved.getUser(),
                saved.getStudio(),
                saved.getDate(),
                saved.getEndTime(),
                saved.getStartTime(),
                saved.getStatus()
        );
    }
}
