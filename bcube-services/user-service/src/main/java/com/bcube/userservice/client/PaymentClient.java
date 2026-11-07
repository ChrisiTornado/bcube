package com.bcube.userservice.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Grants the welcome voucher at registration. Wrapped in try/catch everywhere it's called -
 * a payment-service outage (or the abuse guard silently rejecting a duplicate phone) must
 * never fail registration itself.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentClient {
    @Value("${payment-service.base-url}")
    private String paymentServiceBaseUrl;

    private final RestClient.Builder restClientBuilder;

    public void grantWelcomeVoucher(Long userId, String phone, String token) {
        try {
            restClientBuilder.build()
                    .post()
                    .uri(paymentServiceBaseUrl + "/vouchers/welcome-grant")
                    .headers(headers -> headers.setBearerAuth(token))
                    .body(Map.of("userId", userId, "phone", phone))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.warn("Willkommensgutschein für Nutzer {} konnte nicht vergeben werden: {}", userId, e.getMessage());
        }
    }
}
