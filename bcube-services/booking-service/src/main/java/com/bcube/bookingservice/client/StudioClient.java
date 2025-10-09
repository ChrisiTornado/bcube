package com.bcube.bookingservice.client;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Service
@RequiredArgsConstructor
public class StudioClient {
    @Value("${studio-service.base-url}")
    private String studioServiceBaseUrl;

    private final WebClient.Builder webClientBuilder;

    public boolean studioExists(Long studentId) {
        try {
            webClientBuilder.build()
                    .get()
                    .uri(studioServiceBaseUrl + "/" + studentId)
                    .retrieve()
                    .toBodilessEntity()
                    .block();
            return true;
        } catch (WebClientResponseException.NotFound e) {
            return false;
        }
    }
}
