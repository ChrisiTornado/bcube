package com.bcube.paymentservice.client;

import com.bcube.paymentservice.config.RestClientConfig;
import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The Stripe webhook reports a payment result to booking-service with a PATCH. A failure there
 * must propagate so Stripe retries the webhook (see BookingClient), so both paths are covered.
 */
class BookingClientTest {

    private HttpServer server;
    private final AtomicReference<String> method = new AtomicReference<>();
    private final AtomicReference<String> path = new AtomicReference<>();
    private final AtomicReference<String> body = new AtomicReference<>();
    private final AtomicReference<Headers> headers = new AtomicReference<>();
    private final AtomicInteger status = new AtomicInteger(200);
    private BookingClient client;

    @BeforeEach
    void start() throws IOException {
        server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        server.createContext("/", exchange -> {
            method.set(exchange.getRequestMethod());
            path.set(exchange.getRequestURI().getPath());
            headers.set(exchange.getRequestHeaders());
            body.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            exchange.sendResponseHeaders(status.get(), -1);
            exchange.close();
        });
        server.start();
        client = new BookingClient(new RestClientConfig().restClientBuilder());
        ReflectionTestUtils.setField(client, "bookingServiceBaseUrl", "http://localhost:" + server.getAddress().getPort() + "/api/bookings");
        ReflectionTestUtils.setField(client, "internalServiceKey", "secret-key");
    }

    @AfterEach
    void stop() {
        server.stop(0);
    }

    @Test
    void paymentStatusIsSentAsPatchWithTheInternalKeyAndAJsonBody() {
        client.updatePaymentStatus(12L, "SUCCEEDED");

        assertThat(method.get()).isEqualTo("PATCH");
        assertThat(path.get()).isEqualTo("/api/bookings/12/payment-status");
        assertThat(headers.get().getFirst("X-Internal-Key")).isEqualTo("secret-key");
        assertThat(headers.get().getFirst("Content-Type")).contains("application/json");
        assertThat(body.get()).isEqualTo("{\"status\":\"SUCCEEDED\"}");
    }

    @Test
    void aRejectedUpdateIsNotSwallowedSoStripeRetriesTheWebhook() {
        status.set(403);

        assertThatThrownBy(() -> client.updatePaymentStatus(12L, "SUCCEEDED"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Fehler beim Aktualisieren des Buchungsstatus");
    }
}
