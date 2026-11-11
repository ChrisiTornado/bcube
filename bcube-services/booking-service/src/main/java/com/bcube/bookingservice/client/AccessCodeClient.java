package com.bcube.bookingservice.client;

import com.bcube.bookingservice.service.dto.request.AccessRequest;
import com.bcube.bookingservice.service.dto.response.AccessCodeResponse;
import com.bcube.bookingservice.service.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientResponseException;

/**
 * access-service has no user-facing endpoints - every call it receives is server-to-server from
 * here, authenticated via the shared X-Internal-Key secret instead of forwarding the calling
 * user's own JWT (access-service has no way to independently verify booking ownership anyway;
 * this repository's caller already did that check before reaching any of these methods).
 */
@Service
@RequiredArgsConstructor
public class AccessCodeClient {
    @Value("${access-service.base-url}")
    private String accessServiceBaseUrl;

    @Value("${internal.service-key}")
    private String internalServiceKey;

    private final RestClient.Builder restClientBuilder;

    public AccessCodeResponse generateAccessCode(AccessRequest request) {
        try {
            ApiResponse<AccessCodeResponse> response = restClientBuilder.build()
                    .post()
                    .uri(accessServiceBaseUrl)
                    .headers(headers -> headers.set("X-Internal-Key", internalServiceKey))
                    .body(request)
                    .retrieve()
                    .body(new ParameterizedTypeReference<ApiResponse<AccessCodeResponse>>() {});

            return response != null ? response.getData() : null;
        } catch (RestClientResponseException e) {
            throw new RuntimeException("Fehler beim Erstellen des Zutrittscodes: " + e.getMessage(), e);
        }
    }

    public AccessCodeResponse getAccessCode(Long bookingId) {
        try {
            ApiResponse<AccessCodeResponse> response = restClientBuilder.build()
                    .get()
                    .uri(accessServiceBaseUrl + "/" + bookingId)
                    .headers(headers -> headers.set("X-Internal-Key", internalServiceKey))
                    .retrieve()
                    .body(new ParameterizedTypeReference<ApiResponse<AccessCodeResponse>>() {});

            return response != null ? response.getData() : null;
        } catch (HttpClientErrorException.NotFound e) {
            return null;
        } catch (RestClientResponseException e) {
            throw new RuntimeException("Fehler beim Abrufen des Zutrittscodes: " + e.getMessage(), e);
        }
    }

    public void deleteAccessCode(Long bookingId) {
        try {
            restClientBuilder.build()
                    .delete()
                    .uri(accessServiceBaseUrl + "/" + bookingId)
                    .headers(headers -> headers.set("X-Internal-Key", internalServiceKey))
                    .retrieve()
                    .toBodilessEntity();
        } catch (HttpClientErrorException.NotFound ignored) {
            // Bereits gelöscht oder nicht vorhanden.
        } catch (HttpClientErrorException.BadRequest ignored) {
            // Access-Service meldet aktuell fehlende Codes als 400.
        } catch (RestClientResponseException e) {
            throw new RuntimeException("Fehler beim Löschen des Zutrittscodes: " + e.getMessage(), e);
        }
    }
}
