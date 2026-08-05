package com.bcube.bookingservice.service;

import com.bcube.bookingservice.persistance.entity.Booking;
import com.bcube.bookingservice.persistance.entity.BookingStatus;
import com.bcube.bookingservice.persistance.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;

@Service
@Slf4j
@RequiredArgsConstructor
public class BookingStatusMaintenanceService {

    private static final Set<BookingStatus> OPEN_STATUSES = Set.of(
            BookingStatus.CONFIRMED,
            BookingStatus.PENDING
    );

    private final BookingRepository bookingRepository;
    private final Clock bookingClock;

    @Transactional
    @Scheduled(fixedDelayString = "${booking.status.scheduler.delay-ms:300000}")
    public void markFinishedBookingsAsDone() {
        Instant now = Instant.now(bookingClock);
        LocalDate today = LocalDate.now(bookingClock);

        List<Booking> candidateBookings = bookingRepository.findAllByStatusInAndDateLessThanEqual(
                OPEN_STATUSES,
                today
        );

        // A PENDING booking whose slot has passed was never actually paid/occupied - FAILED,
        // not DONE. Only a CONFIRMED booking (paid or voucher-covered) genuinely happened.
        int updatedCount = 0;
        for (Booking booking : candidateBookings) {
            if (booking.getEndTime().isAfter(now)) {
                continue;
            }
            booking.setStatus(booking.getStatus() == BookingStatus.PENDING ? BookingStatus.FAILED : BookingStatus.DONE);
            updatedCount++;
        }

        if (updatedCount > 0) {
            log.info("Updated status on {} finished bookings", updatedCount);
        }
    }
}
