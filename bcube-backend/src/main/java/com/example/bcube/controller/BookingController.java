package com.example.bcube.controller;

import com.example.bcube.service.dto.request.BookStudioRequest;
import com.example.bcube.service.dto.response.ApiResponse;
import com.example.bcube.service.dto.response.BookingResponse;
import com.example.bcube.service.impl.BookingServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class BookingController {
    private final BookingServiceImpl bookingService;
    @GetMapping("/bookings")
    public ResponseEntity<ApiResponse<BookingResponse[]>> getFreeTimeSlots() {
        BookingResponse[] bookings = bookingService.getAllBookings();
        return  ResponseEntity.ok(new ApiResponse<>("Bookings sent", bookings));
    }

    @PostMapping("/bookings")
    public ResponseEntity<ApiResponse<BookingResponse>> bookStudio(@RequestBody BookStudioRequest bookStudioRequest) {
        BookingResponse booking = bookingService.bookTimeSlot(bookStudioRequest);
        return ResponseEntity.ok(new ApiResponse<>("Studio erfolgreich gebucht", booking));
    }

    @GetMapping("/bookings/user/{userId}")
    public ResponseEntity<ApiResponse<BookingResponse[]>> getBookingsByUserId(@PathVariable Long userId) {
        BookingResponse[] bookings = bookingService.getBookingsByUserId(userId);
        return  ResponseEntity.ok(new ApiResponse<>("Bookings sent", bookings));
    }

    @GetMapping("bookings/{bookingId}")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingById(@PathVariable Long bookingId) {
        BookingResponse booking = bookingService.getBookingById(bookingId);
        return ResponseEntity.ok(new ApiResponse<>("Booking sent", booking));
    }

    @DeleteMapping("bookings/storno/{bookingId}")
    public ResponseEntity<ApiResponse<BookingResponse>> stornoBookingById(@PathVariable Long bookingId) {
        BookingResponse booking = bookingService.stornoBooking(bookingId);
        return ResponseEntity.ok(new ApiResponse<>("Booking sent", booking));
    }
}
