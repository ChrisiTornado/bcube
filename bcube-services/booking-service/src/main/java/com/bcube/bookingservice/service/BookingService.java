package com.bcube.bookingservice.service;

import com.bcube.bookingservice.service.dto.request.BookStudioRequest;
import com.bcube.bookingservice.service.dto.response.BookingResponse;

public interface BookingService {
    BookingResponse[] getAllBookings();
    BookingResponse bookTimeSlot(BookStudioRequest bookStudioRequest);

    BookingResponse[] getBookingsByUserId(Long userId);

    BookingResponse getBookingById(Long bookingId);

    BookingResponse stornoBooking(Long bookingId);

    BookingResponse[] getBookingsByStudioId(long studioId);
}