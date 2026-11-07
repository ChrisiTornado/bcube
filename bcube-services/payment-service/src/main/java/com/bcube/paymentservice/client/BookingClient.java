package com.bcube.paymentservice.client;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class BookingClient {
    @Value("${booking-service.base-url}")
    private String bookingServiceBaseUrl;

    @Value("${internal.service-key}")
    private String internalServiceKey;

    private final RestClient.Builder restClientBuilder;

    /**
     * Called from the Stripe webhook handler, which has no user JWT to forward.
     * Authenticated via the shared X-Internal-Key secret instead. A failure here is
     * intentionally left to propagate as a non-2xx response to Stripe, which retries
     * the webhook automatically - silently swallowing it would leave the booking stuck
     * PENDING with no way to reach CONFIRMED/FAILED.
     */
    public void updatePaymentStatus(Long bookingId, String status) {
        try {
            restClientBuilder.build()
                    .patch()
                    .uri(bookingServiceBaseUrl + "/" + bookingId + "/payment-status")
                    .headers(headers -> headers.set("X-Internal-Key", internalServiceKey))
                    .body(Map.of("status", status))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException e) {
            throw new RuntimeException("Fehler beim Aktualisieren des Buchungsstatus: " + e.getMessage(), e);
        }
    }
}
