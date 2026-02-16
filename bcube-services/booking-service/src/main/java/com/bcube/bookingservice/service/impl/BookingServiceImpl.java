package com.bcube.bookingservice.service.impl;

import com.bcube.bookingservice.client.AccessCodeClient;
import com.bcube.bookingservice.client.StudioClient;
import com.bcube.bookingservice.client.UserClient;
import com.bcube.bookingservice.exception.AccessCodeNotReceivedException;
import com.bcube.bookingservice.exception.BookingDoneException;
import com.bcube.bookingservice.persistance.entity.Booking;
import com.bcube.bookingservice.persistance.entity.BookingStatus;
import com.bcube.bookingservice.persistance.repository.BookingRepository;
import com.bcube.bookingservice.service.BookingService;
import com.bcube.bookingservice.service.dto.Classes.StudioDto;
import com.bcube.bookingservice.service.dto.Classes.UserDto;
import com.bcube.bookingservice.service.dto.request.AccessRequest;
import com.bcube.bookingservice.service.dto.request.BookStudioRequest;
import com.bcube.bookingservice.service.dto.response.BookingDetailsResponse;
import com.bcube.bookingservice.service.dto.response.AccessCodeResponse;
import com.bcube.bookingservice.service.dto.response.BookingResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
    private final AccessCodeClient accessCodeClient;

    @Transactional(readOnly = true)
    @Override
    public Page<BookingResponse> getBookings(
            int page,
            int size,
            Long userId,
            Long studioId
    ) {
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by("id").descending()
        );

        Page<Booking> bookings;

        if (userId != null && studioId != null) {
            bookings = bookingRepository
                    .findAllByUserIdAndStudioId(userId, studioId, pageable);

        } else if (userId != null) {
            bookings = bookingRepository
                    .findAllByUserId(userId, pageable);

        } else if (studioId != null) {
            bookings = bookingRepository
                    .findAllByStudioId(studioId, pageable);

        } else {
            bookings = bookingRepository.findAll(pageable);
        }

        // ToDo: Bulk import

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
    public Page<BookingResponse> getBookingsByUserId(Long userId, int page, int size, Long studioId) {
        if (!userClient.userExists(userId)) {
            throw new IllegalArgumentException("User mit ID " + userId + " nicht gefunden");
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<Booking> bookings;

        if (studioId != null) {
            bookings = bookingRepository.findAllByUserIdAndStudioId(userId, studioId, pageable);
        } else {
            bookings = bookingRepository.findAllByUserId(userId, pageable);
        }

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
    public BookingDetailsResponse getBookingById(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Buchung mit ID " + bookingId + "nicht gefunden"));

        UserDto user = userClient.getUserById(booking.getUserId());
        StudioDto studio = studioClient.getStudioById(booking.getStudioId());

        AccessCodeResponse accessCodeResponse = accessCodeClient.getAccessCode(bookingId);

        if (accessCodeResponse == null) {
            throw new AccessCodeNotReceivedException("Zutrittscode konnte nicht erstellt werden");
        }

        return new BookingDetailsResponse(
                booking.getId(),
                user,
                studio,
                booking.getDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getStatus(),
                accessCodeResponse.getAccessCode()
        );
    }

    @Override
    public BookingResponse stornoBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Buchung mit ID " + bookingId + " nicht gefunden"));

        if (isFinished(booking, Instant.now())) {
            booking.setStatus(BookingStatus.DONE);
            bookingRepository.save(booking);
            throw new BookingDoneException(
                    "Buchung mit ID " + bookingId + " wurde bereits durchgeführt"
            );
        }

        if (hasStarted(booking, Instant.now())) {
            throw new BookingDoneException(
                    "Buchung mit ID " + bookingId + " hat bereits gestartet"
            );
        }

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

    @Transactional
    @Override
    public BookingDetailsResponse bookTimeSlot(BookStudioRequest bookStudioRequest) {
        Booking booking = createBookingEntity(bookStudioRequest);
        AccessRequest request = new AccessRequest(
                booking.getId(),
                bookStudioRequest.getDate() + "T" + bookStudioRequest.getStartTime() + ":00",
                bookStudioRequest.getDate() + "T" + bookStudioRequest.getEndTime() + ":00"
        );
            AccessCodeResponse accessCodeResponse = accessCodeClient.generateAccessCode(request);
            if (accessCodeResponse == null) {
                throw new AccessCodeNotReceivedException("Zutrittscode konnte nicht erstellt werden");
            }

            booking.setStatus(BookingStatus.CONFIRMED);

            UserDto user = userClient.getUserById(booking.getUserId());
            StudioDto studio = studioClient.getStudioById(booking.getStudioId());

            //get temp code
            return new BookingDetailsResponse(
                    booking.getId(),
                    user,
                    studio,
                    booking.getDate(),
                    booking.getStartTime(),
                    booking.getEndTime(),
                    booking.getStatus(),
                    accessCodeResponse.getAccessCode()
            );
    }

    public Booking createBookingEntity(BookStudioRequest bookStudioRequest) {
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd.MM.yyyy");
        LocalDate date = LocalDate.parse(bookStudioRequest.getDate(), dateFormatter);

        String startDateTimeString = bookStudioRequest.getDate() + "T" + bookStudioRequest.getStartTime() + ":00"; // z. B. "07.07.2025T13:15:00"
        String endDateTimeString = bookStudioRequest.getDate() + "T" + bookStudioRequest.getEndTime() + ":00";

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy'T'HH:mm:ss");
        LocalDateTime start = LocalDateTime.parse(startDateTimeString, formatter);
        LocalDateTime end = LocalDateTime.parse(endDateTimeString, formatter);

        Instant startTime = start.atZone(ZoneId.of("Europe/Vienna")).toInstant();
        Instant endTime = end.atZone(ZoneId.of("Europe/Vienna")).toInstant();
        Instant now = Instant.now();

        if (startTime.isAfter(endTime)) {
            throw new IllegalArgumentException("Start time is after end time");
        }

        if (now.isAfter(endTime)) {
            throw new IllegalArgumentException("End time is after the current time");
        }

        Booking booking = Booking.builder()
                .userId(bookStudioRequest.getUserID())
                .studioId(bookStudioRequest.getStudioID())
                .date(date)
                .startTime(startTime)
                .endTime(endTime)
                .status(BookingStatus.PENDING)
                .build();

        return bookingRepository.save(booking);
    }

    boolean isFinished(Booking booking, Instant now) {
        return now.isAfter(booking.getEndTime());
    }

    boolean hasStarted(Booking booking, Instant now) {
        return !now.isBefore(booking.getStartTime());
    }
}