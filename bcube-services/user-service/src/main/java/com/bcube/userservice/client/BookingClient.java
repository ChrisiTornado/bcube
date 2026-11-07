package com.bcube.userservice.client;

import com.bcube.userservice.service.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Service
@RequiredArgsConstructor
public class BookingClient {
    @Value("${booking-service.base-url}")
    private String bookingServiceBaseUrl;

    private final RestClient.Builder restClientBuilder;

    /** Checked before an account is deleted - a user with a still-active (CONFIRMED/PENDING)
     * booking must cancel it first rather than have it silently disappear along with their
     * account. Forwards the calling admin's own JWT, same as every other cross-service call. */
    public boolean hasOpenBookings(Long userId, String token) {
        try {
            ApiResponse<Boolean> response = restClientBuilder.build()
                    .get()
                    .uri(bookingServiceBaseUrl + "/user/" + userId + "/has-open")
                    .headers(headers -> headers.setBearerAuth(token))
                    .retrieve()
                    .body(new ParameterizedTypeReference<ApiResponse<Boolean>>() {});

            return response != null && Boolean.TRUE.equals(response.getData());
        } catch (RestClientResponseException e) {
            throw new RuntimeException("Fehler beim Prüfen offener Buchungen: " + e.getMessage(), e);
        }
    }
}
