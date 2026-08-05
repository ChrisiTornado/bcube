package com.bcube.paymentservice.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.HashMap;
import java.util.Map;

/**
 * Fires payment-related emails via user-service, which only knows the paying user's id - unlike
 * booking-service, payment-service never resolves the user's email itself, so the payload here
 * carries userId and user-service's NotificationController looks the user up. Same shared
 * X-Internal-Key auth as BookingClient (there's no user JWT in scope on the Stripe webhook path).
 * Best-effort: a failure here is logged and never blocks the payment operation it's attached to.
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

    public void sendPaymentSucceeded(Long userId, String studioName, String date, String amount) {
        Map<String, Object> body = new HashMap<>();
        body.put("userId", userId);
        body.put("studioName", studioName);
        body.put("date", date);
        body.put("amount", amount);
        post("/payment-succeeded", body);
    }

    public void sendPaymentFailed(Long userId, String studioName, String date) {
        Map<String, Object> body = new HashMap<>();
        body.put("userId", userId);
        body.put("studioName", studioName);
        body.put("date", date);
        post("/payment-failed", body);
    }

    public void sendRefundProcessed(Long userId, String studioName, String amount) {
        Map<String, Object> body = new HashMap<>();
        body.put("userId", userId);
        body.put("studioName", studioName);
        body.put("amount", amount);
        post("/refund-processed", body);
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
