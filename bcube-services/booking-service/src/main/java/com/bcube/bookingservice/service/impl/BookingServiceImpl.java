package com.bcube.bookingservice.service.impl;

import com.bcube.bookingservice.client.StudioClient;
import com.bcube.bookingservice.client.UserClient;
import com.bcube.bookingservice.persistance.entity.Booking;
import com.bcube.bookingservice.persistance.entity.BookingStatus;
import com.bcube.bookingservice.persistance.repository.BookingRepository;
import com.bcube.bookingservice.service.BookingService;
import com.bcube.bookingservice.service.dto.Classes.StudioDto;
import com.bcube.bookingservice.service.dto.Classes.UserDto;
import com.bcube.bookingservice.service.dto.request.BookStudioRequest;
import com.bcube.bookingservice.service.dto.response.BookingResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final UserClient userClient;
    private final StudioClient studioClient;

    @Override
    public Page<BookingResponse> getAllBookings(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Booking> bookings = bookingRepository.findAll(pageable);

        return bookings.map(booking -> {
            UserDto user = userClient.getUserById(booking.getUserId());
            StudioDto studio = studioClient.getStudioById(booking.getStudioId());

            return new BookingResponse(
                    booking.getId(),
                    user,
                    studio,
                    booking.getDate(),
                    booking.getStartTime(),
                    booking.getEndTime(),
                    booking.getStatus()
            );
        });
    }

    @Transactional(readOnly = true)
    @Override
    public Page<BookingResponse> getBookingsByUserId(Long userId, int page, int size) {
        if (!userClient.userExists(userId)) {
            throw new IllegalArgumentException("User mit ID " + userId + " nicht gefunden");
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<Booking> bookings = bookingRepository.findAllByUserId(userId, pageable);

        return bookings.map(booking -> {
            UserDto user = userClient.getUserById(booking.getUserId());
            StudioDto studio = studioClient.getStudioById(booking.getStudioId());

            return new BookingResponse(
                    booking.getId(),
                    user,
                    studio,
                    booking.getDate(),
                    booking.getStartTime(),
                    booking.getEndTime(),
                    booking.getStatus()
            );
        });
    }

    private BookingResponse[] getBookingResponses(List<Booking> bookings) {
        List<BookingResponse> responses = bookings.stream()
                .map(booking -> {
                    UserDto user = userClient.getUserById(booking.getUserId());
                    StudioDto studio = studioClient.getStudioById(booking.getStudioId());

                    return new BookingResponse(
                            booking.getId(),
                            user,
                            studio,
                            booking.getDate(),
                            booking.getStartTime(),
                            booking.getEndTime(),
                            booking.getStatus()
                    );
                })
                .toList();

        return responses.toArray(new BookingResponse[0]);
    }

    @Override
    public BookingResponse[] getBookingsByStudioId(long studioId) {
        if (!studioClient.studioExists(studioId)) {
            throw new IllegalArgumentException("User mit ID " + studioId + " nicht gefunden");
        }

        List<Booking> bookings = bookingRepository.findAllByStudioId(studioId);

        return getBookingResponses(bookings);
    }

    @Override
    public BookingResponse getBookingById(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Buchung mit ID " + bookingId + "nicht gefunden"));

        UserDto user = userClient.getUserById(booking.getUserId());
        StudioDto studio = studioClient.getStudioById(booking.getStudioId());

        return new BookingResponse(
                booking.getId(),
                user,
                studio,
                booking.getDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getStatus()
        );
    }

    @Override
    public BookingResponse stornoBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Buchung mit ID " + bookingId + "nicht gefunden"));

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
        UserDto user = userClient.getUserById(booking.getUserId());
        StudioDto studio = studioClient.getStudioById(booking.getStudioId());

        return new BookingResponse(
                booking.getId(),
                user,
                studio,
                booking.getDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getStatus()
        );
    }

    @Override
    public BookingResponse bookTimeSlot(BookStudioRequest bookStudioRequest) {
        if (!userClient.userExists(bookStudioRequest.getUserID())) {
            throw new IllegalArgumentException("User mit ID " + bookStudioRequest.getUserID() + " nicht gefunden");
        }

        if (!studioClient.studioExists(bookStudioRequest.getStudioID())) {
            throw new IllegalArgumentException("User mit ID " + bookStudioRequest.getStudioID() + " nicht gefunden");
        }

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
                .userId(bookStudioRequest.getUserID())
                .studioId(bookStudioRequest.getStudioID())
                .date(date)
                .startTime(startTime)
                .endTime(endTime)
                .status(BookingStatus.CONFIRMED)
                .build();

        Booking saved = bookingRepository.save(booking);

        UserDto user = userClient.getUserById(booking.getUserId());
        StudioDto studio = studioClient.getStudioById(booking.getStudioId());

        return new BookingResponse(
                saved.getId(),
                user,
                studio,
                saved.getDate(),
                saved.getEndTime(),
                saved.getStartTime(),
                saved.getStatus()
        );
    }
}