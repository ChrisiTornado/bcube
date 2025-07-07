package com.example.bcube.service;

import com.example.bcube.service.dto.request.BookStudioRequest;
import com.example.bcube.service.dto.response.BookingResponse;

public interface BookingService {
    BookingResponse[] getAllBookings();
    BookingResponse bookTimeSlot(BookStudioRequest bookStudioRequest);
}
