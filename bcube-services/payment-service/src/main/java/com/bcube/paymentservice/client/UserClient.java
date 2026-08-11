package com.bcube.paymentservice.client;

import com.bcube.paymentservice.exception.UserNotFoundException;
import com.bcube.paymentservice.service.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

/**
 * Fetches the buyer's name/email for invoice rendering. Unlike BookingClient/NotificationClient
 * (internal-key auth, used from the Stripe webhook path with no user in scope), invoice download
 * is always a user-initiated, JWT-authenticated request, so this forwards the caller's own bearer
 * token - same pattern as booking-service's UserClient.
 */
@Service
@RequiredArgsConstructor
public class UserClient {
    @Value("${user-service.base-url}")
    private String userServiceBaseUrl;

    private final WebClient.Builder webClientBuilder;

    public UserDto getUserById(Long userId, String token) {
        try {
            ApiResponse<UserDto> response = webClientBuilder.build()
                    .get()
                    .uri(userServiceBaseUrl + "/" + userId)
                    .headers(headers -> headers.setBearerAuth(token))
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<ApiResponse<UserDto>>() {})
                    .block();

            if (response == null || response.getData() == null) {
                throw new UserNotFoundException("User nicht gefunden");
            }

            return response.getData();
        } catch (WebClientResponseException e) {
            throw new RuntimeException("Fehler beim Abrufen des Users: " + e.getMessage(), e);
        }
    }
}
