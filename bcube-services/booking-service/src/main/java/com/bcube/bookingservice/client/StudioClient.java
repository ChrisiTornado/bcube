package com.bcube.bookingservice.client;

import com.bcube.bookingservice.exception.StudioNotFoundException;
import com.bcube.bookingservice.service.dto.Classes.StudioDto;
import com.bcube.bookingservice.service.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Service
@RequiredArgsConstructor
public class StudioClient {
    @Value("${studio-service.base-url}")
    private String studioServiceBaseUrl;

    private final WebClient.Builder webClientBuilder;

    public boolean studioExists(Long studioId) {
        try {
            webClientBuilder.build()
                    .get()
                    .uri(studioServiceBaseUrl + "/" + studioId)
                    .retrieve()
                    .toBodilessEntity()
                    .block();
            return true;
        } catch (WebClientResponseException.NotFound e) {
            return false;
        }
    }

    public StudioDto getStudioById(Long studioId) {
        try {
            ApiResponse<StudioDto> response = webClientBuilder.build()
                    .get()
                    .uri(studioServiceBaseUrl + "/" + studioId)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<ApiResponse<StudioDto>>() {})
                    .block();

            if (response == null || response.getData() == null) {
                throw new StudioNotFoundException("Studio nicht gefunden");
            }

            return response.getData();
        } catch (WebClientResponseException.NotFound e) {
            throw new StudioNotFoundException("Studio nicht gefunden");
        } catch (WebClientResponseException e) {
            throw new RuntimeException("Fehler beim Abrufen des Studios: " + e.getMessage(), e);
        }
    }
}
