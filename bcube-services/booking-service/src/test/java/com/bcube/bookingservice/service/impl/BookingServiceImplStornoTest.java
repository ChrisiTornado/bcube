package com.bcube.bookingservice.service.impl;

import com.bcube.bookingservice.client.AccessCodeClient;
import com.bcube.bookingservice.client.NotificationClient;
import com.bcube.bookingservice.client.PaymentClient;
import com.bcube.bookingservice.client.StudioClient;
import com.bcube.bookingservice.client.UserClient;
import com.bcube.bookingservice.persistance.entity.Booking;
import com.bcube.bookingservice.persistance.entity.BookingStatus;
import com.bcube.bookingservice.persistance.repository.BookingRepository;
import com.bcube.bookingservice.security.InternalTokenProvider;
import com.bcube.bookingservice.security.RequestingUser;
import com.bcube.bookingservice.service.IpAbuseGuardService;
import com.bcube.bookingservice.service.dto.Classes.StudioDto;
import com.bcube.bookingservice.service.dto.Classes.UserDto;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class BookingServiceImplStornoTest {

    private final BookingRepository bookingRepository = mock(BookingRepository.class);
    private final UserClient userClient = mock(UserClient.class);
    private final StudioClient studioClient = mock(StudioClient.class);
    private final AccessCodeClient accessCodeClient = mock(AccessCodeClient.class);
    private final PaymentClient paymentClient = mock(PaymentClient.class);
    private final InternalTokenProvider internalTokenProvider = mock(InternalTokenProvider.class);
    private final NotificationClient notificationClient = mock(NotificationClient.class);
    private final IpAbuseGuardService ipAbuseGuardService = mock(IpAbuseGuardService.class);

    private final BookingServiceImpl bookingService = new BookingServiceImpl(
            bookingRepository, userClient, studioClient, accessCodeClient, paymentClient, internalTokenProvider, notificationClient, ipAbuseGuardService
    );

    private static final RequestingUser OWNER = new RequestingUser(2L, false);

    private Booking confirmedBooking(Instant startTime) {
        Booking booking = Booking.builder()
                .id(1L)
                .userId(2L)
                .studioId(3L)
                .smartlockId(4L)
                .date(LocalDate.now())
                .startTime(startTime)
                .endTime(startTime.plusSeconds(3600))
                .status(BookingStatus.CONFIRMED)
                .createdAt(Instant.now())
                .build();
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(userClient.getUserById(anyLong(), anyString())).thenReturn(mock(UserDto.class));
        when(studioClient.getStudioById(anyLong())).thenReturn(mock(StudioDto.class));
        return booking;
    }

    @Test
    void refundsFullyWhenCancelledMoreThan24hBeforeStart() {
        confirmedBooking(Instant.now().plusSeconds(48 * 3600));

        bookingService.stornoBooking(1L, "127.0.0.1", "token", OWNER);

        verify(paymentClient).refund(1L, 100, "token");
    }

    @Test
    void refundsHalfWhenCancelledWithin24hOfStart() {
        confirmedBooking(Instant.now().plusSeconds(12 * 3600));

        bookingService.stornoBooking(1L, "127.0.0.1", "token", OWNER);

        verify(paymentClient).refund(1L, 50, "token");
    }

    @Test
    void doesNotRefundBookingsThatWereNeverConfirmed() {
        Booking booking = Booking.builder()
                .id(1L)
                .userId(2L)
                .studioId(3L)
                .date(LocalDate.now())
                .startTime(Instant.now().plusSeconds(48 * 3600))
                .endTime(Instant.now().plusSeconds(48 * 3600 + 3600))
                .status(BookingStatus.PENDING)
                .createdAt(Instant.now())
                .build();
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(userClient.getUserById(anyLong(), anyString())).thenReturn(mock(UserDto.class));
        when(studioClient.getStudioById(anyLong())).thenReturn(mock(StudioDto.class));

        bookingService.stornoBooking(1L, "127.0.0.1", "token", OWNER);

        verify(paymentClient, never()).refund(anyLong(), anyInt(), anyString());
    }

    @Test
    void stornoSucceedsEvenWhenRefundCallFails() {
        confirmedBooking(Instant.now().plusSeconds(48 * 3600));
        doThrow(new RuntimeException("payment-service down")).when(paymentClient).refund(anyLong(), anyInt(), anyString());

        bookingService.stornoBooking(1L, "127.0.0.1", "token", OWNER);

        verify(bookingRepository).save(argThat(b -> b.getStatus() == BookingStatus.CANCELLED));
    }
}
