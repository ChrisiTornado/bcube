package com.bcube.bookingservice.service;

import com.bcube.bookingservice.service.dto.request.BookStudioRequest;
import com.bcube.bookingservice.service.dto.response.BookingDetailsResponse;
import com.bcube.bookingservice.service.dto.response.BookingResponse;
import org.springframework.data.domain.Page;

public interface BookingService {
    Page<BookingResponse> getBookings(int page, int size, Long userId, Long studioId, String token);
    BookingDetailsResponse bookTimeSlot(BookStudioRequest bookStudioRequest, String token);

    Page<BookingResponse> getBookingsByUserId(Long userId, int page, int size, Long studioId, String token);

    BookingDetailsResponse getBookingById(Long bookingId, String token);

    BookingResponse stornoBooking(Long bookingId, String token);

    BookingResponse[] getBookingsByStudioId(long studioId, String token);

    void updatePaymentStatus(Long bookingId, String status);
}
