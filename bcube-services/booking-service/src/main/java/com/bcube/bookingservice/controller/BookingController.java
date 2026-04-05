package com.bcube.bookingservice.controller;

import com.bcube.bookingservice.service.BookingService;
import com.bcube.bookingservice.service.dto.request.BookStudioRequest;
import com.bcube.bookingservice.service.dto.request.AdminBookingQueryRequest;
import com.bcube.bookingservice.service.dto.request.UserBookingQueryRequest;
import com.bcube.bookingservice.service.dto.response.ApiResponse;
import com.bcube.bookingservice.service.dto.response.BookingDetailsResponse;
import com.bcube.bookingservice.service.dto.response.BookingResponse;
import com.bcube.bookingservice.service.impl.BookingServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    private String extractToken(String authorizationHeader) {
        return authorizationHeader.replace("Bearer ", "");
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<BookingResponse>>> getBookings(
            AdminBookingQueryRequest request,
            @RequestHeader("Authorization") String authorizationHeader
    ) {
        Page<BookingResponse> bookings = bookingService.getBookings(
                request.getPage(),
                request.getSize(),
                request.getUserId(),
                request.getStudioId(),
                extractToken(authorizationHeader)
        );
        return  ResponseEntity.ok(new ApiResponse<>("Freie Zeiten erfolgreich geladen", bookings));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BookingDetailsResponse>> bookStudio(
            @RequestBody BookStudioRequest bookStudioRequest,
            @RequestHeader("Authorization") String authorizationHeader
    ) {
        BookingDetailsResponse booking = bookingService.bookTimeSlot(bookStudioRequest, extractToken(authorizationHeader));
        return ResponseEntity.ok(new ApiResponse<>(booking.getStudio().getName()+" erfolgreich gebucht", booking));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<Page<BookingResponse>>> getBookingsByUserId(UserBookingQueryRequest request, @RequestHeader("Authorization") String authorizationHeader) {
        String token = extractToken(authorizationHeader);
        Page<BookingResponse> bookings = bookingService.getBookingsByUserId(request.getUserId(), request.getPage(), request.getSize(), request.getStudioId(), token);
        return  ResponseEntity.ok(new ApiResponse<>("Buchungen erfolgreich geladen", bookings));
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<ApiResponse<BookingDetailsResponse>> getBookingById(
            @PathVariable Long bookingId,
            @RequestHeader("Authorization") String authorizationHeader
    ) {
        BookingDetailsResponse booking = bookingService.getBookingById(bookingId, extractToken(authorizationHeader));
        return ResponseEntity.ok(new ApiResponse<>("Buchung erfolgreich gesendet", booking));
    }

    @DeleteMapping("/{bookingId}")
    public ResponseEntity<ApiResponse<BookingResponse>> stornoBookingById(
            @PathVariable Long bookingId,
            @RequestHeader("Authorization") String authorizationHeader
    ) {
        BookingResponse booking = bookingService.stornoBooking(bookingId, extractToken(authorizationHeader));
        return ResponseEntity.ok(new ApiResponse<>("Buchung: " + bookingId + " erfolgreich storniert", booking));
    }

    @GetMapping("/studio/{studioId}")
    public ResponseEntity<ApiResponse<BookingResponse[]>> getBookingsByStudio(
            @PathVariable Long studioId,
            @RequestHeader("Authorization") String authorizationHeader
    ) {
        BookingResponse[] bookings = bookingService.getBookingsByStudioId(studioId, extractToken(authorizationHeader));
        return ResponseEntity.ok(new ApiResponse<>("Buchungen erfolgreich geladen", bookings));
    }
}
