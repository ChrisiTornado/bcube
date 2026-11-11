package com.bcube.paymentservice.client;

import com.bcube.paymentservice.exception.UserNotFoundException;
import com.bcube.paymentservice.service.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

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

    private final RestClient.Builder restClientBuilder;

    public UserDto getUserById(Long userId, String token) {
        try {
            ApiResponse<UserDto> response = restClientBuilder.build()
                    .get()
                    .uri(userServiceBaseUrl + "/" + userId)
                    .headers(headers -> headers.setBearerAuth(token))
                    .retrieve()
                    .body(new ParameterizedTypeReference<ApiResponse<UserDto>>() {});

            if (response == null || response.getData() == null) {
                throw new UserNotFoundException("User nicht gefunden");
            }

            return response.getData();
        } catch (RestClientResponseException e) {
            throw new RuntimeException("Fehler beim Abrufen des Users: " + e.getMessage(), e);
        }
    }
}
