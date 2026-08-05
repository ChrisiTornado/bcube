package com.bcube.userservice.controller;

import com.bcube.userservice.exception.UserNotFoundException;
import com.bcube.userservice.persistance.entity.User;
import com.bcube.userservice.persistance.repository.UserRepository;
import com.bcube.userservice.service.dto.request.BookingNotificationRequest;
import com.bcube.userservice.service.dto.request.PaymentNotificationRequest;
import com.bcube.userservice.service.dto.request.RefundNotificationRequest;
import com.bcube.userservice.service.dto.response.ApiResponse;
import com.bcube.userservice.service.impl.MailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Called by other services (booking-service, payment-service) to trigger an email off the back of
 * something that happened there. Every endpoint here is exempted from the JWT filter chain (see
 * WebSecurityConfig) and checked instead against the shared X-Internal-Key secret with a
 * constant-time comparison - booking-service already has the paying user's email in hand at its
 * call sites and sends it directly, while payment-service only ever knows the user's id, so those
 * endpoints resolve the User via UserRepository here instead of making payment-service look it up
 * itself first.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notifications")
public class NotificationController {
    private final MailService mailService;
    private final UserRepository userRepository;

    @Value("${internal.service-key}")
    private String internalServiceKey;

    private void verifyInternalKey(String providedKey) {
        if (providedKey == null || !MessageDigest.isEqual(
                providedKey.getBytes(StandardCharsets.UTF_8),
                internalServiceKey.getBytes(StandardCharsets.UTF_8)
        )) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ungültiger interner Schlüssel");
        }
    }

    private User resolveUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User nicht gefunden: " + userId));
    }

    @PostMapping("/booking-confirmed")
    public ResponseEntity<ApiResponse<Void>> bookingConfirmed(
            @RequestHeader("X-Internal-Key") String internalKey,
            @Valid @RequestBody BookingNotificationRequest request
    ) {
        verifyInternalKey(internalKey);
        mailService.sendBookingConfirmedEmail(request.getEmail(), request.getFirstName(), request.getStudioName(), request.getDate(), request.getTime());
        return ResponseEntity.ok(new ApiResponse<>("Benachrichtigung gesendet", null));
    }

    @PostMapping("/booking-cancelled")
    public ResponseEntity<ApiResponse<Void>> bookingCancelled(
            @RequestHeader("X-Internal-Key") String internalKey,
            @Valid @RequestBody BookingNotificationRequest request
    ) {
        verifyInternalKey(internalKey);
        mailService.sendBookingCancelledEmail(request.getEmail(), request.getFirstName(), request.getStudioName(), request.getDate(), request.getTime(), request.getRefundNote());
        return ResponseEntity.ok(new ApiResponse<>("Benachrichtigung gesendet", null));
    }

    @PostMapping("/booking-reminder")
    public ResponseEntity<ApiResponse<Void>> bookingReminder(
            @RequestHeader("X-Internal-Key") String internalKey,
            @Valid @RequestBody BookingNotificationRequest request
    ) {
        verifyInternalKey(internalKey);
        mailService.sendBookingReminderEmail(request.getEmail(), request.getFirstName(), request.getStudioName(), request.getDate(), request.getTime());
        return ResponseEntity.ok(new ApiResponse<>("Benachrichtigung gesendet", null));
    }

    @PostMapping("/payment-succeeded")
    public ResponseEntity<ApiResponse<Void>> paymentSucceeded(
            @RequestHeader("X-Internal-Key") String internalKey,
            @Valid @RequestBody PaymentNotificationRequest request
    ) {
        verifyInternalKey(internalKey);
        User user = resolveUser(request.getUserId());
        mailService.sendPaymentSucceededEmail(user.getEmail(), user.getFirstName(), request.getStudioName(), request.getDate(), request.getAmount());
        return ResponseEntity.ok(new ApiResponse<>("Benachrichtigung gesendet", null));
    }

    @PostMapping("/payment-failed")
    public ResponseEntity<ApiResponse<Void>> paymentFailed(
            @RequestHeader("X-Internal-Key") String internalKey,
            @Valid @RequestBody PaymentNotificationRequest request
    ) {
        verifyInternalKey(internalKey);
        User user = resolveUser(request.getUserId());
        mailService.sendPaymentFailedEmail(user.getEmail(), user.getFirstName(), request.getStudioName(), request.getDate());
        return ResponseEntity.ok(new ApiResponse<>("Benachrichtigung gesendet", null));
    }

    @PostMapping("/refund-processed")
    public ResponseEntity<ApiResponse<Void>> refundProcessed(
            @RequestHeader("X-Internal-Key") String internalKey,
            @Valid @RequestBody RefundNotificationRequest request
    ) {
        verifyInternalKey(internalKey);
        User user = resolveUser(request.getUserId());
        mailService.sendRefundProcessedEmail(user.getEmail(), user.getFirstName(), request.getStudioName(), request.getAmount());
        return ResponseEntity.ok(new ApiResponse<>("Benachrichtigung gesendet", null));
    }
}
