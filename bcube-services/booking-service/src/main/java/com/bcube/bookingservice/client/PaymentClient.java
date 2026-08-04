package com.bcube.bookingservice.client;

import com.bcube.bookingservice.service.dto.Classes.PaymentIntentDto;
import com.bcube.bookingservice.service.dto.request.CreatePaymentIntentRequest;
import com.bcube.bookingservice.service.dto.response.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentClient {
    @Value("${payment-service.base-url}")
    private String paymentServiceBaseUrl;

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    public PaymentIntentDto createPaymentIntent(CreatePaymentIntentRequest request, String token) {
        try {
            ApiResponse<PaymentIntentDto> response = webClientBuilder.build()
                    .post()
                    .uri(paymentServiceBaseUrl + "/intents")
                    .headers(headers -> headers.setBearerAuth(token))
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<ApiResponse<PaymentIntentDto>>() {})
                    .block();

            return response != null ? response.getData() : null;
        } catch (WebClientResponseException.BadRequest e) {
            // Voucher/validation failures from payment-service - surface the real message
            // (e.g. "Gutschein wurde bereits eingelöst") instead of a generic 500.
            throw new IllegalArgumentException(extractMessage(e));
        } catch (WebClientResponseException e) {
            throw new RuntimeException("Fehler beim Erstellen der Zahlung: " + e.getMessage(), e);
        }
    }

    private String extractMessage(WebClientResponseException e) {
        try {
            ApiResponse<?> body = objectMapper.readValue(e.getResponseBodyAsString(), ApiResponse.class);
            return body.getMessage() != null ? body.getMessage() : "Zahlung konnte nicht erstellt werden";
        } catch (Exception parseError) {
            return "Zahlung konnte nicht erstellt werden";
        }
    }

    /**
     * Refund failures are logged by the caller and never block the storno itself - same
     * operational tradeoff already accepted for AccessCodeClient.deleteAccessCode failures.
     */
    public void refund(Long bookingId, int refundPercentage, String token) {
        try {
            webClientBuilder.build()
                    .post()
                    .uri(paymentServiceBaseUrl + "/" + bookingId + "/refund")
                    .headers(headers -> headers.setBearerAuth(token))
                    .bodyValue(Map.of("refundPercentage", refundPercentage))
                    .retrieve()
                    .toBodilessEntity()
                    .block();
        } catch (WebClientResponseException.NotFound ignored) {
            // No payment exists for this booking (e.g. it was never actually confirmed) - nothing to refund.
        } catch (WebClientResponseException e) {
            throw new RuntimeException("Fehler bei der Rückerstattung: " + e.getMessage(), e);
        }
    }
}
