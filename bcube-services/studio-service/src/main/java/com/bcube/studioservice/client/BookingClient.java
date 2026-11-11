package com.bcube.studioservice.client;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Service
@RequiredArgsConstructor
public class BookingClient {
    @Value("${booking-service.base-url}")
    private String bookingServiceBaseUrl;

    private final RestClient.Builder restClientBuilder;

    /**
     * Cleans up every booking for a studio (Nuki revoke + refund where paid) before the studio
     * itself is deleted - see booking-service's deleteAllBookingsForStudio. Forwards the calling
     * admin's own JWT, same as every other cross-service call in this codebase.
     */
    public void deleteBookingsForStudio(Long studioId, String token) {
        try {
            restClientBuilder.build()
                    .delete()
                    .uri(bookingServiceBaseUrl + "/studio/" + studioId)
                    .headers(headers -> headers.setBearerAuth(token))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException e) {
            throw new RuntimeException("Fehler beim Löschen der Buchungen für Studio " + studioId + ": " + e.getMessage(), e);
        }
    }
}
