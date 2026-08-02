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

@Service
@RequiredArgsConstructor
public class AccessCodeClient {
    @Value("${access-service.base-url}")
    private String accessServiceBaseUrl;

    private final WebClient.Builder webClientBuilder;

    public AccessCodeResponse generateAccessCode(AccessRequest request, String token) {
            ApiResponse<AccessCodeResponse> response = webClientBuilder.build()
                    .post()
                    .uri(accessServiceBaseUrl)
                    .headers(headers -> headers.setBearerAuth(token))
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(new  ParameterizedTypeReference<ApiResponse<AccessCodeResponse>>() {})
                    .block();

            return response != null ? response.getData() : null;
    }

    public AccessCodeResponse getAccessCode(Long bookingId, String token) {
        try {
            ApiResponse<AccessCodeResponse> response = webClientBuilder.build()
                    .get()
                    .uri(accessServiceBaseUrl + "/" + bookingId)
                    .headers(headers -> headers.setBearerAuth(token))
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

    public void deleteAccessCode(Long bookingId, String token) {
        try {
            webClientBuilder.build()
                    .delete()
                    .uri(accessServiceBaseUrl + "/" + bookingId)
                    .headers(headers -> headers.setBearerAuth(token))
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
