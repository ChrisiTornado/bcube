package com.bcube.bookingservice.service.impl;

import com.bcube.bookingservice.client.AccessCodeClient;
import com.bcube.bookingservice.client.PaymentClient;
import com.bcube.bookingservice.client.StudioClient;
import com.bcube.bookingservice.client.UserClient;
import com.bcube.bookingservice.exception.AccessCodeNotReceivedException;
import com.bcube.bookingservice.exception.BookingDoneException;
import com.bcube.bookingservice.exception.BookingNotFoundException;
import com.bcube.bookingservice.exception.StudioNotFoundException;
import com.bcube.bookingservice.exception.UserNotFoundException;
import com.bcube.bookingservice.persistance.entity.Booking;
import com.bcube.bookingservice.persistance.entity.BookingStatus;
import com.bcube.bookingservice.persistance.repository.BookingRepository;
import com.bcube.bookingservice.security.InternalTokenProvider;
import com.bcube.bookingservice.service.BookingService;
import com.bcube.bookingservice.service.dto.Classes.PaymentIntentDto;
import com.bcube.bookingservice.service.dto.Classes.StudioDto;
import com.bcube.bookingservice.service.dto.Classes.UserDto;
import com.bcube.bookingservice.service.dto.request.AccessRequest;
import com.bcube.bookingservice.service.dto.request.BookStudioRequest;
import com.bcube.bookingservice.service.dto.request.CreatePaymentIntentRequest;
import com.bcube.bookingservice.service.dto.response.BookingDetailsResponse;
import com.bcube.bookingservice.service.dto.response.AccessCodeResponse;
import com.bcube.bookingservice.service.dto.response.BookingResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private static final Set<BookingStatus> BLOCKING_STATUSES = Set.of(
            BookingStatus.CONFIRMED,
            BookingStatus.PENDING,
            BookingStatus.DONE
    );

    // Deliberately narrower than BLOCKING_STATUSES (which also includes DONE, for the unrelated
    // time-slot-overlap check in bookTimeSlot). DONE means the session already happened - that's
    // a closed, historical record, not "still open" from an account-deletion point of view.
    private static final Set<BookingStatus> OPEN_STATUSES = Set.of(
            BookingStatus.CONFIRMED,
            BookingStatus.PENDING
    );

    private static final DateTimeFormatter ISO_UTC_FMT = DateTimeFormatter
            .ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
            .withZone(ZoneOffset.UTC);

    private final BookingRepository bookingRepository;
    private final UserClient userClient;
    private final StudioClient studioClient;
    private final AccessCodeClient accessCodeClient;
    private final PaymentClient paymentClient;
    private final InternalTokenProvider internalTokenProvider;

    @Transactional(readOnly = true)
    @Override
    public Page<BookingResponse> getBookings(
            int page,
            int size,
            Long userId,
            Long studioId,
            String token
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
            UserDto user = userClient.getUserById(booking.getUserId(), token);
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
    public Page<BookingResponse> getBookingsByUserId(Long userId, int page, int size, Long studioId, String token) {
        if (!userClient.userExists(userId, token)) {
            throw new UserNotFoundException("User mit ID " + userId + " nicht gefunden");
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<Booking> bookings;

        if (studioId != null) {
            bookings = bookingRepository.findAllByUserIdAndStudioId(userId, studioId, pageable);
        } else {
            bookings = bookingRepository.findAllByUserId(userId, pageable);
        }

        return bookings.map(booking -> {
            UserDto user = userClient.getUserById(booking.getUserId(), token);
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

    private BookingResponse[] getBookingResponses(List<Booking> bookings, String token) {
        List<BookingResponse> responses = bookings.stream()
                .map(booking -> {
                    UserDto user = userClient.getUserById(booking.getUserId(), token);
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
    public BookingResponse[] getBookingsByStudioId(long studioId, String token) {
        if (!studioClient.studioExists(studioId)) {
            throw new StudioNotFoundException("Studio mit ID " + studioId + " nicht gefunden");
        }

        List<Booking> bookings = bookingRepository.findAllByStudioId(studioId);

        return getBookingResponses(bookings, token);
    }

    @Override
    public BookingDetailsResponse getBookingById(Long bookingId, String token) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Buchung mit ID " + bookingId + " nicht gefunden"));

        UserDto user = userClient.getUserById(booking.getUserId(), token);
        StudioDto studio = studioClient.getStudioById(booking.getStudioId());

        // A PENDING (awaiting payment) or FAILED booking has no access code yet - only
        // CONFIRMED/DONE bookings actually had Nuki access granted.
        String accessCode = null;
        if (booking.getStatus() == BookingStatus.CONFIRMED || booking.getStatus() == BookingStatus.DONE) {
            AccessCodeResponse accessCodeResponse = accessCodeClient.getAccessCode(bookingId, token);
            if (accessCodeResponse == null) {
                throw new AccessCodeNotReceivedException("Zutrittscode konnte nicht erstellt werden");
            }
            accessCode = accessCodeResponse.getAccessCode();
        }

        return new BookingDetailsResponse(
                booking.getId(),
                user,
                studio,
                booking.getDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getStatus(),
                accessCode,
                null,
                null
        );
    }

    @Override
    public BookingResponse stornoBooking(Long bookingId, String token) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Buchung mit ID " + bookingId + " nicht gefunden"));

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

        BookingStatus previousStatus = booking.getStatus();

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
        accessCodeClient.deleteAccessCode(bookingId, token);

        if (previousStatus == BookingStatus.CONFIRMED) {
            refundIfPaid(booking, token);
        }

        UserDto user = userClient.getUserById(booking.getUserId(), token);
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

    /**
     * >24h before the booking's start time -> 100% refund, otherwise 50%. A no-op server-side
     * for FREE (voucher-covered) payments. Refund failures are logged but never block the
     * storno itself - the booking is cancelled and access revoked either way, same tradeoff
     * already accepted for accessCodeClient.deleteAccessCode failures.
     */
    private void refundIfPaid(Booking booking, String token) {
        boolean moreThan24hOut = Duration.between(Instant.now(), booking.getStartTime()).toHours() >= 24;
        int refundPercentage = moreThan24hOut ? 100 : 50;

        try {
            paymentClient.refund(booking.getId(), refundPercentage, token);
        } catch (Exception e) {
            log.error("Rückerstattung für Buchung {} fehlgeschlagen: {}", booking.getId(), e.getMessage(), e);
        }
    }

    /**
     * Runs the same cleanup stornoBooking does (Nuki revoke + refund where money was actually
     * captured) for every non-terminal booking on a studio, then hard-deletes all its bookings -
     * used when an admin deletes the studio itself. Unlike stornoBooking, this does NOT refuse
     * to touch already-started/finished bookings (isFinished/hasStarted guard rails exist only
     * to stop a *user* from cancelling a booking that's already happening - an admin deleting the
     * studio has to clean up regardless of timing), and DONE bookings are left un-refunded on
     * purpose (the session already happened; only their booking row gets removed). A single
     * booking's cleanup failing doesn't block the rest - the studio is being deleted either way,
     * so best-effort cleanup plus a hard delete beats leaving some bookings behind entirely.
     */
    @Override
    @Transactional
    public void deleteAllBookingsForStudio(Long studioId, String token) {
        List<Booking> bookings = bookingRepository.findAllByStudioId(studioId);

        for (Booking booking : bookings) {
            if (booking.getStatus() == BookingStatus.CONFIRMED || booking.getStatus() == BookingStatus.PENDING) {
                try {
                    accessCodeClient.deleteAccessCode(booking.getId(), token);
                } catch (Exception e) {
                    log.error("Zutrittscode-Löschung für Buchung {} (Cube-Löschung) fehlgeschlagen: {}",
                            booking.getId(), e.getMessage(), e);
                }

                if (booking.getStatus() == BookingStatus.CONFIRMED) {
                    refundIfPaid(booking, token);
                }
            }
        }

        bookingRepository.deleteAll(bookings);
    }

    @Override
    public boolean hasOpenBookings(Long userId) {
        return bookingRepository.existsByUserIdAndStatusIn(userId, OPEN_STATUSES);
    }

    @Transactional
    @Override
    public BookingDetailsResponse bookTimeSlot(BookStudioRequest bookStudioRequest, String token) {
        Booking booking = createBookingEntity(bookStudioRequest);

        StudioDto studio = studioClient.getStudioById(booking.getStudioId());
        BigDecimal durationHours = BigDecimal.valueOf(Duration.between(booking.getStartTime(), booking.getEndTime()).toMinutes())
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);

        CreatePaymentIntentRequest paymentRequest = new CreatePaymentIntentRequest(
                booking.getId(),
                booking.getUserId(),
                booking.getStudioId(),
                studio.getHourlyRateCents(),
                durationHours,
                "eur",
                studio.getName(),
                booking.getDate(),
                bookStudioRequest.getVoucherCode()
        );

        // If payment-service itself is unreachable, this throws and the @Transactional method
        // rolls back the whole booking - the slot becomes free again rather than staying stuck
        // as an unpayable PENDING row. No silent fallback to granting access either way.
        PaymentIntentDto paymentIntent = paymentClient.createPaymentIntent(paymentRequest, token);

        UserDto user = userClient.getUserById(booking.getUserId(), token);

        if ("FREE".equals(paymentIntent.getStatus())) {
            String accessCode = grantAccessAndConfirm(booking, token);
            return new BookingDetailsResponse(
                    booking.getId(),
                    user,
                    studio,
                    booking.getDate(),
                    booking.getStartTime(),
                    booking.getEndTime(),
                    booking.getStatus(),
                    accessCode,
                    null,
                    0
            );
        }

        return new BookingDetailsResponse(
                booking.getId(),
                user,
                studio,
                booking.getDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getStatus(),
                null,
                paymentIntent.getClientSecret(),
                paymentIntent.getFinalAmountCents()
        );
    }

    /**
     * Grants Nuki access and moves the booking to CONFIRMED - shared by the synchronous
     * FREE (voucher-covered) path and the async webhook-driven SUCCEEDED path. Fixes the
     * previous bug where the status change was set but never persisted.
     */
    private String grantAccessAndConfirm(Booking booking, String token) {
        AccessRequest request = new AccessRequest(
                booking.getId(),
                booking.getSmartlockId(),
                ISO_UTC_FMT.format(booking.getStartTime()),
                ISO_UTC_FMT.format(booking.getEndTime())
        );

        AccessCodeResponse accessCodeResponse = accessCodeClient.generateAccessCode(request, token);
        if (accessCodeResponse == null) {
            throw new AccessCodeNotReceivedException("Zutrittscode konnte nicht erstellt werden");
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        return accessCodeResponse.getAccessCode();
    }

    @Override
    @Transactional
    public void updatePaymentStatus(Long bookingId, String status) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Buchung mit ID " + bookingId + " nicht gefunden"));

        if (booking.getStatus() != BookingStatus.PENDING) {
            // Already finalized - Stripe may redeliver the same webhook event, or the
            // BookingStatusMaintenanceService already flipped this to FAILED. No-op either way.
            log.debug("Ignoring payment-status callback for booking {} already in status {}", bookingId, booking.getStatus());
            return;
        }

        if ("SUCCEEDED".equals(status)) {
            String systemToken = internalTokenProvider.generateSystemToken();
            grantAccessAndConfirm(booking, systemToken);
        } else {
            booking.setStatus(BookingStatus.FAILED);
            bookingRepository.save(booking);
        }
    }

    public Booking createBookingEntity(BookStudioRequest bookStudioRequest) {
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd.MM.yyyy");
        LocalDate date = LocalDate.parse(bookStudioRequest.getDate(), dateFormatter);

        String dateWithDashes = date.format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));
        String startDateTimeString = dateWithDashes + "T" + bookStudioRequest.getStartTime() + ":00.000Z";// z. B. "07-07-2025T13:15:00.000Z"
        String endDateTimeString = dateWithDashes + "T" + bookStudioRequest.getEndTime() + ":00.000Z";

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy'T'HH:mm:ss.SSS'Z'");
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

        List<Booking> dayBookings = bookingRepository.findAllByStudioIdAndDate(
                bookStudioRequest.getStudioID(),
                date
        );

        boolean overlapsWithActiveBooking = dayBookings.stream()
                .filter(existing -> BLOCKING_STATUSES.contains(existing.getStatus()))
                .anyMatch(existing ->
                        startTime.isBefore(existing.getEndTime()) &&
                        endTime.isAfter(existing.getStartTime())
                );

        if (overlapsWithActiveBooking) {
            throw new IllegalArgumentException("Der gewählte Zeitraum überschneidet sich mit einer bestehenden Buchung");
        }

        Booking booking = Booking.builder()
                .userId(bookStudioRequest.getUserID())
                .studioId(bookStudioRequest.getStudioID())
                .smartlockId(bookStudioRequest.getSmartlockID())
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
