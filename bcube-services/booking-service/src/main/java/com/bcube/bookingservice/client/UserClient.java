package com.bcube.bookingservice.client;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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
}
