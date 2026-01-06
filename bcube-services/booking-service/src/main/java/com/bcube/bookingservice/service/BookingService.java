package com.bcube.bookingservice.service;

import com.bcube.bookingservice.service.dto.request.BookStudioRequest;
import com.bcube.bookingservice.service.dto.response.BookingResponse;
import org.springframework.data.domain.Page;

public interface BookingService {
    Page<BookingResponse> getBookings(int page, int size, Long userId, Long studioId);
    BookingResponse bookTimeSlot(BookStudioRequest bookStudioRequest);

    Page<BookingResponse> getBookingsByUserId(Long userId, int page, int size, Long studioId);

    BookingResponse getBookingById(Long bookingId);

    BookingResponse stornoBooking(Long bookingId);

    BookingResponse[] getBookingsByStudioId(long studioId);
}