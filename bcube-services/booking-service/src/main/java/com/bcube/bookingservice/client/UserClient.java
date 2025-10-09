package com.bcube.bookingservice.client;

import com.bcube.bookingservice.service.dto.Classes.UserDto;
import com.bcube.bookingservice.service.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Service
@RequiredArgsConstructor
public class UserClient {
    @Value("${user-service.base-url}")
    private String userServiceBaseUrl;

    private final WebClient.Builder webClientBuilder;

    public boolean userExists(Long userId) {
        try {
            webClientBuilder.build()
                    .get()
                    .uri(userServiceBaseUrl + "/" + userId)
                    .retrieve()
                    .toBodilessEntity()
                    .block();
            return true;
        } catch (WebClientResponseException.NotFound e) {
            return false;
        }
    }

    public UserDto getUserById(Long userId) {
        try {
            ApiResponse<UserDto> response = webClientBuilder.build()
                    .get()
                    .uri(userServiceBaseUrl + "/" + userId)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<ApiResponse<UserDto>>() {})
                    .block();

            return response != null ? response.getData() : null;
        } catch (WebClientResponseException.NotFound e) {
            return null;
        } catch (WebClientResponseException e) {
            throw new RuntimeException("Fehler beim Abrufen des Users: " + e.getMessage(), e);
        }
    }
}
