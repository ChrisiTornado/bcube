package com.bcube.bookingservice.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.HashMap;
import java.util.Map;

/**
 * Fires the booking-confirmed/cancelled emails via user-service (the only service with mail
 * configured). Authenticated with the shared X-Internal-Key secret rather than a forwarded user
 * JWT - the CONFIRMED path can run from an async Stripe-webhook callback with only a system JWT
 * in scope, so this mirrors the same shared-secret pattern already used for the payment-status
 * callback into this service, instead of juggling two different token shapes.
 * Best-effort: a failure here is logged and never blocks the booking operation it's attached to.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationClient {
    @Value("${notification-service.base-url}")
    private String notificationServiceBaseUrl;

    @Value("${internal.service-key}")
    private String internalServiceKey;

    private final WebClient.Builder webClientBuilder;

    public void sendBookingConfirmed(String email, String firstName, String studioName, String date, String time) {
        post("/booking-confirmed", bookingBody(email, firstName, studioName, date, time, null));
    }

    public void sendBookingCancelled(String email, String firstName, String studioName, String date, String time, String refundNote) {
        post("/booking-cancelled", bookingBody(email, firstName, studioName, date, time, refundNote));
    }

    public void sendBookingReminder(String email, String firstName, String studioName, String date, String time) {
        post("/booking-reminder", bookingBody(email, firstName, studioName, date, time, null));
    }

    private Map<String, String> bookingBody(String email, String firstName, String studioName, String date, String time, String refundNote) {
        Map<String, String> body = new HashMap<>();
        body.put("email", email);
        body.put("firstName", firstName);
        body.put("studioName", studioName);
        body.put("date", date);
        body.put("time", time);
        if (refundNote != null) {
            body.put("refundNote", refundNote);
        }
        return body;
    }

    private void post(String path, Object body) {
        try {
            webClientBuilder.build()
                    .post()
                    .uri(notificationServiceBaseUrl + path)
                    .headers(headers -> headers.set("X-Internal-Key", internalServiceKey))
                    .bodyValue(body)
                    .retrieve()
                    .toBodilessEntity()
                    .block();
        } catch (WebClientResponseException e) {
            log.error("Benachrichtigung ({}) konnte nicht gesendet werden: {}", path, e.getMessage(), e);
        } catch (Exception e) {
            log.error("Benachrichtigung ({}) konnte nicht gesendet werden: {}", path, e.getMessage(), e);
        }
    }
}
