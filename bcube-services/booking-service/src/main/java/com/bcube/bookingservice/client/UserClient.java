package com.bcube.bookingservice.client;

import com.bcube.bookingservice.exception.UserNotFoundException;
import com.bcube.bookingservice.service.dto.Classes.UserDto;
import com.bcube.bookingservice.service.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientResponseException;

@Service
@RequiredArgsConstructor
public class UserClient {
    @Value("${user-service.base-url}")
    private String userServiceBaseUrl;

    private final RestClient.Builder restClientBuilder;

    public boolean userExists(Long userId, String token) {
        try {
            restClientBuilder.build()
                    .get()
                    .uri(userServiceBaseUrl + "/" + userId)
                    .headers(headers -> headers.setBearerAuth(token))
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (HttpClientErrorException.NotFound e) {
            return false;
        }
    }

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
        } catch (HttpClientErrorException.NotFound e) {
            return null;
        } catch (RestClientResponseException e) {
            throw new RuntimeException("Fehler beim Abrufen des Users: " + e.getMessage(), e);
        }
    }
}
