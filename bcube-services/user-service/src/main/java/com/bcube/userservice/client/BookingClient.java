package com.bcube.userservice.client;

import com.bcube.userservice.service.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Service
@RequiredArgsConstructor
public class BookingClient {
    @Value("${booking-service.base-url}")
    private String bookingServiceBaseUrl;

    private final WebClient.Builder webClientBuilder;

    /** Checked before an account is deleted - a user with a still-active (CONFIRMED/PENDING)
     * booking must cancel it first rather than have it silently disappear along with their
     * account. Forwards the calling admin's own JWT, same as every other cross-service call. */
    public boolean hasOpenBookings(Long userId, String token) {
        try {
            ApiResponse<Boolean> response = webClientBuilder.build()
                    .get()
                    .uri(bookingServiceBaseUrl + "/user/" + userId + "/has-open")
                    .headers(headers -> headers.setBearerAuth(token))
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<ApiResponse<Boolean>>() {})
                    .block();

            return response != null && Boolean.TRUE.equals(response.getData());
        } catch (WebClientResponseException e) {
            throw new RuntimeException("Fehler beim Prüfen offener Buchungen: " + e.getMessage(), e);
        }
    }
}
