package com.bcube.bookingservice.client;

import com.bcube.bookingservice.exception.StudioNotFoundException;
import com.bcube.bookingservice.service.dto.Classes.StudioDto;
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
/**
 * Uses studio-service's /summary variant: the full /{id} response carries the whole image gallery
 * as Base64 (tens of MB), which is far too large to ship between services and is never needed here.
 */
public class StudioClient {
    @Value("${studio-service.base-url}")
    private String studioServiceBaseUrl;

    private final RestClient.Builder restClientBuilder;

    public boolean studioExists(Long studioId) {
        try {
            restClientBuilder.build()
                    .get()
                    .uri(studioServiceBaseUrl + "/" + studioId + "/summary")
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (HttpClientErrorException.NotFound e) {
            return false;
        }
    }

    public StudioDto getStudioById(Long studioId) {
        try {
            ApiResponse<StudioDto> response = restClientBuilder.build()
                    .get()
                    .uri(studioServiceBaseUrl + "/" + studioId + "/summary")
                    .retrieve()
                    .body(new ParameterizedTypeReference<ApiResponse<StudioDto>>() {});

            if (response == null || response.getData() == null) {
                throw new StudioNotFoundException("Studio nicht gefunden");
            }

            return response.getData();
        } catch (HttpClientErrorException.NotFound e) {
            throw new StudioNotFoundException("Studio nicht gefunden");
        } catch (RestClientResponseException e) {
            throw new RuntimeException("Fehler beim Abrufen des Studios: " + e.getMessage(), e);
        }
    }
}
