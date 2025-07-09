package com.example.bcube.service;

import com.example.bcube.service.dto.request.BookStudioRequest;
import com.example.bcube.service.dto.response.BookingResponse;

import java.util.List;

public interface BookingService {
    BookingResponse[] getAllBookings();
    BookingResponse bookTimeSlot(BookStudioRequest bookStudioRequest);

    BookingResponse[] getBookingsByUserId(Long userId);

    BookingResponse getBookingById(Long bookingId);
}
