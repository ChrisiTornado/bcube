package com.bcube.bookingservice.service;

import com.bcube.bookingservice.persistance.entity.Booking;
import com.bcube.bookingservice.persistance.entity.BookingStatus;
import com.bcube.bookingservice.persistance.repository.BookingRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Collection;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class BookingStatusMaintenanceServiceTest {

    private static final ZoneId VIENNA_ZONE = ZoneId.of("Europe/Vienna");
    private static final Instant NOW = Instant.parse("2026-04-21T15:00:00Z");

    @Test
    void marksExpiredConfirmedAsDoneAndExpiredPendingAsFailed() {
        Booking expiredConfirmed = booking(1L, BookingStatus.CONFIRMED, Instant.parse("2026-04-21T13:00:00Z"));
        Booking expiredPending = booking(2L, BookingStatus.PENDING, Instant.parse("2026-04-21T14:59:00Z"));
        Booking futureConfirmed = booking(3L, BookingStatus.CONFIRMED, Instant.parse("2026-04-21T16:30:00Z"));

        AtomicReference<Collection<BookingStatus>> requestedStatuses = new AtomicReference<>();
        AtomicReference<LocalDate> requestedDate = new AtomicReference<>();

        BookingRepository repository = repositoryProxy(
                List.of(expiredConfirmed, expiredPending, futureConfirmed),
                requestedStatuses,
                requestedDate
        );

        BookingStatusMaintenanceService service = new BookingStatusMaintenanceService(
                repository,
                Clock.fixed(NOW, VIENNA_ZONE)
        );

        service.markFinishedBookingsAsDone();

        assertThat(expiredConfirmed.getStatus()).isEqualTo(BookingStatus.DONE);
        assertThat(expiredPending.getStatus()).isEqualTo(BookingStatus.FAILED);
        assertThat(futureConfirmed.getStatus()).isEqualTo(BookingStatus.CONFIRMED);
        assertThat(requestedStatuses.get()).containsExactlyInAnyOrder(
                BookingStatus.CONFIRMED,
                BookingStatus.PENDING
        );
        assertThat(requestedDate.get()).isEqualTo(LocalDate.of(2026, 4, 21));
    }

    @Test
    void ignoresBookingsThatHaveNotReachedTheirEndYet() {
        Booking futurePending = booking(4L, BookingStatus.PENDING, Instant.parse("2026-04-21T15:30:00Z"));

        BookingRepository repository = repositoryProxy(
                List.of(futurePending),
                new AtomicReference<>(),
                new AtomicReference<>()
        );

        BookingStatusMaintenanceService service = new BookingStatusMaintenanceService(
                repository,
                Clock.fixed(NOW, VIENNA_ZONE)
        );

        service.markFinishedBookingsAsDone();

        assertThat(futurePending.getStatus()).isEqualTo(BookingStatus.PENDING);
    }

    @SuppressWarnings("unchecked")
    private BookingRepository repositoryProxy(
            List<Booking> bookings,
            AtomicReference<Collection<BookingStatus>> requestedStatuses,
            AtomicReference<LocalDate> requestedDate
    ) {
        return (BookingRepository) Proxy.newProxyInstance(
                BookingRepository.class.getClassLoader(),
                new Class<?>[]{BookingRepository.class},
                (proxy, method, args) -> {
                    if ("findAllByStatusInAndDateLessThanEqual".equals(method.getName())) {
                        requestedStatuses.set((Collection<BookingStatus>) args[0]);
                        requestedDate.set((LocalDate) args[1]);
                        return bookings;
                    }

                    if ("toString".equals(method.getName())) {
                        return "BookingRepositoryTestProxy";
                    }

                    throw new UnsupportedOperationException("Method not supported in test: " + method.getName());
                }
        );
    }

    private Booking booking(Long id, BookingStatus status, Instant endTime) {
        return Booking.builder()
                .id(id)
                .userId(8L)
                .studioId(3L)
                .date(LocalDate.of(2026, 4, 21))
                .startTime(endTime.minusSeconds(3600))
                .endTime(endTime)
                .status(status)
                .createdAt(NOW.minusSeconds(7200))
                .build();
    }
}
