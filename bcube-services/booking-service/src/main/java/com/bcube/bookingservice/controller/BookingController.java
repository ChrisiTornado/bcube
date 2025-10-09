package com.bcube.bookingservice.controller;

import com.bcube.bookingservice.service.dto.request.BookStudioRequest;
import com.bcube.bookingservice.service.dto.response.ApiResponse;
import com.bcube.bookingservice.service.dto.response.BookingResponse;
import com.bcube.bookingservice.service.impl.BookingServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping("/bookings/{bookingId}")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingById(@PathVariable Long bookingId) {
        BookingResponse booking = bookingService.getBookingById(bookingId);
        return ResponseEntity.ok(new ApiResponse<>("Booking sent", booking));
    }

    @DeleteMapping("/bookings/{bookingId}")
    public ResponseEntity<ApiResponse<BookingResponse>> stornoBookingById(@PathVariable Long bookingId) {
        BookingResponse booking = bookingService.stornoBooking(bookingId);
        return ResponseEntity.ok(new ApiResponse<>("Booking sent", booking));
    }

    @GetMapping("/bookings/studio/{studioId}")
    public ResponseEntity<ApiResponse<BookingResponse[]>> getBookingsByStudio(@PathVariable Long studioId) {
        BookingResponse[] bookings = bookingService.getBookingsByStudioId(studioId);
        return ResponseEntity.ok(new ApiResponse<>("Studio-Bookings geladen", bookings));
    }
}