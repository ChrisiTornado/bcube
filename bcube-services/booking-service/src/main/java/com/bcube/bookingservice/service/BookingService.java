package com.bcube.bookingservice.service;

import com.bcube.bookingservice.security.RequestingUser;
import com.bcube.bookingservice.service.dto.request.BookStudioRequest;
import com.bcube.bookingservice.service.dto.response.BookingDetailsResponse;
import com.bcube.bookingservice.service.dto.response.BookingResponse;
import org.springframework.data.domain.Page;

public interface BookingService {
    Page<BookingResponse> getBookings(int page, int size, Long userId, Long studioId, String sortBy, String sortDirection, String token);
    BookingDetailsResponse bookTimeSlot(BookStudioRequest bookStudioRequest, String ipAddress, String token, RequestingUser requester);

    Page<BookingResponse> getBookingsByUserId(Long userId, int page, int size, Long studioId, String sortBy, String sortDirection, String token, RequestingUser requester);

    BookingDetailsResponse getBookingById(Long bookingId, String token, RequestingUser requester);

    BookingResponse stornoBooking(Long bookingId, String ipAddress, String token, RequestingUser requester);

    BookingResponse[] getBookingsByStudioId(long studioId);

    void updatePaymentStatus(Long bookingId, String status);

    /**
     * Called when an admin deletes a studio - cleans up every booking for it (Nuki access
     * revocation + refund where money was actually captured, same as a normal storno) before
     * removing the booking rows entirely, so a deleted studio never leaves orphaned bookings
     * pointing at nothing.
     */
    void deleteAllBookingsForStudio(Long studioId, String token);

    /**
     * Called by user-service before deleting an account - a user with a still-active booking
     * (CONFIRMED/PENDING) must cancel it first rather than have it silently disappear along with
     * their account. DONE/CANCELLED/FAILED are terminal and don't block deletion.
     */
    boolean hasOpenBookings(Long userId, RequestingUser requester);
}
