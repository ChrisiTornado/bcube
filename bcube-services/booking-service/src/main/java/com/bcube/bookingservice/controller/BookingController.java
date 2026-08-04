package com.bcube.bookingservice.controller;

import com.bcube.bookingservice.service.BookingService;
import com.bcube.bookingservice.service.dto.request.BookStudioRequest;
import com.bcube.bookingservice.service.dto.request.AdminBookingQueryRequest;
import com.bcube.bookingservice.service.dto.request.BookingPaymentStatusRequest;
import com.bcube.bookingservice.service.dto.request.UserBookingQueryRequest;
import com.bcube.bookingservice.service.dto.response.ApiResponse;
import com.bcube.bookingservice.service.dto.response.BookingDetailsResponse;
import com.bcube.bookingservice.service.dto.response.BookingResponse;
import com.bcube.bookingservice.service.impl.BookingServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    @Value("${internal.service-key}")
    private String internalServiceKey;

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

    /**
     * Called by user-service before deleting an account - authenticated like every other route
     * here (no ADMIN role required), since the calling admin's own JWT already satisfies it.
     */
    @GetMapping("/user/{userId}/has-open")
    public ResponseEntity<ApiResponse<Boolean>> hasOpenBookings(@PathVariable Long userId) {
        boolean hasOpen = bookingService.hasOpenBookings(userId);
        return ResponseEntity.ok(new ApiResponse<>("Offene Buchungen geprüft", hasOpen));
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

    /**
     * Called by studio-service right before it deletes a studio, forwarding the same admin JWT
     * that authorized the studio deletion itself (studio-service's delete endpoint is already
     * hasRole("ADMIN")-gated, so this route mirrors that here rather than introducing a separate
     * internal-key secret for an action that always does have a real admin token available).
     */
    @DeleteMapping("/studio/{studioId}")
    public ResponseEntity<ApiResponse<Void>> deleteBookingsByStudio(
            @PathVariable Long studioId,
            @RequestHeader("Authorization") String authorizationHeader
    ) {
        bookingService.deleteAllBookingsForStudio(studioId, extractToken(authorizationHeader));
        return ResponseEntity.ok(new ApiResponse<>("Buchungen erfolgreich gelöscht", null));
    }

    /**
     * Called by payment-service's Stripe webhook handler, which has no user JWT to forward.
     * Authenticated via the shared X-Internal-Key secret instead of the usual JWT filter chain
     * (exempted in WebSecurityConfig) - checked here with a constant-time comparison.
     */
    @PatchMapping("/{bookingId}/payment-status")
    public ResponseEntity<ApiResponse<Void>> updatePaymentStatus(
            @PathVariable Long bookingId,
            @RequestHeader("X-Internal-Key") String providedKey,
            @RequestBody BookingPaymentStatusRequest request
    ) {
        if (!MessageDigest.isEqual(
                providedKey.getBytes(StandardCharsets.UTF_8),
                internalServiceKey.getBytes(StandardCharsets.UTF_8)
        )) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ungültiger interner Schlüssel");
        }

        bookingService.updatePaymentStatus(bookingId, request.getStatus());
        return ResponseEntity.ok(new ApiResponse<>("Zahlungsstatus aktualisiert", null));
    }
}
