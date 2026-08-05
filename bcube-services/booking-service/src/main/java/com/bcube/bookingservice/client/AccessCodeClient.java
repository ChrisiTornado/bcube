package com.bcube.bookingservice.client;

import com.bcube.bookingservice.service.dto.request.AccessRequest;
import com.bcube.bookingservice.service.dto.response.AccessCodeResponse;
import com.bcube.bookingservice.service.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

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

    private final WebClient.Builder webClientBuilder;

    public AccessCodeResponse generateAccessCode(AccessRequest request) {
        try {
            ApiResponse<AccessCodeResponse> response = webClientBuilder.build()
                    .post()
                    .uri(accessServiceBaseUrl)
                    .headers(headers -> headers.set("X-Internal-Key", internalServiceKey))
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<ApiResponse<AccessCodeResponse>>() {})
                    .block();

            return response != null ? response.getData() : null;
        } catch (WebClientResponseException e) {
            throw new RuntimeException("Fehler beim Erstellen des Zutrittscodes: " + e.getMessage(), e);
        }
    }

    public AccessCodeResponse getAccessCode(Long bookingId) {
        try {
            ApiResponse<AccessCodeResponse> response = webClientBuilder.build()
                    .get()
                    .uri(accessServiceBaseUrl + "/" + bookingId)
                    .headers(headers -> headers.set("X-Internal-Key", internalServiceKey))
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<ApiResponse<AccessCodeResponse>>() {})
                    .block();

            return response != null ? response.getData() : null;
        } catch (WebClientResponseException.NotFound e) {
            return null;
        } catch (WebClientResponseException e) {
            throw new RuntimeException("Fehler beim Abrufen des Zutrittscodes: " + e.getMessage(), e);
        }
    }

    public void deleteAccessCode(Long bookingId) {
        try {
            webClientBuilder.build()
                    .delete()
                    .uri(accessServiceBaseUrl + "/" + bookingId)
                    .headers(headers -> headers.set("X-Internal-Key", internalServiceKey))
                    .retrieve()
                    .toBodilessEntity()
                    .block();
        } catch (WebClientResponseException.NotFound ignored) {
            // Bereits gelöscht oder nicht vorhanden.
        } catch (WebClientResponseException.BadRequest ignored) {
            // Access-Service meldet aktuell fehlende Codes als 400.
        } catch (WebClientResponseException e) {
            throw new RuntimeException("Fehler beim Löschen des Zutrittscodes: " + e.getMessage(), e);
        }
    }
}
