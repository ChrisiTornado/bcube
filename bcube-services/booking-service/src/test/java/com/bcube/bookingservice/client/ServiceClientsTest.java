package com.bcube.bookingservice.client;

import com.bcube.bookingservice.config.RestClientConfig;
import com.bcube.bookingservice.config.RequestIdFilter;
import com.bcube.bookingservice.exception.StudioNotFoundException;
import com.bcube.bookingservice.service.dto.Classes.StudioDto;
import com.bcube.bookingservice.service.dto.request.AccessRequest;
import com.bcube.bookingservice.service.dto.request.CreatePaymentIntentRequest;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The blocking RestClient calls against a real local HTTP server: JSON mapping of the shared
 * ApiResponse envelope, status-to-exception mapping, the internal-key / bearer headers and the
 * request-ID propagation.
 */
class ServiceClientsTest {

    private HttpServer server;
    private final Map<String, Stub> stubs = new ConcurrentHashMap<>();
    private final AtomicReference<com.sun.net.httpserver.Headers> lastHeaders = new AtomicReference<>();
    private final AtomicReference<String> lastMethod = new AtomicReference<>();
    private final AtomicReference<String> lastBody = new AtomicReference<>();
    private RestClient.Builder builder;
    private String base;

    private record Stub(int status, String body) {
    }

    @BeforeEach
    void startServer() throws IOException {
        server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        server.createContext("/", exchange -> {
            lastHeaders.set(exchange.getRequestHeaders());
            lastMethod.set(exchange.getRequestMethod());
            lastBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            Stub stub = stubs.getOrDefault(exchange.getRequestURI().getPath(), new Stub(404, ""));
            byte[] body = stub.body().getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(stub.status(), body.length == 0 ? -1 : body.length);
            if (body.length > 0) {
                exchange.getResponseBody().write(body);
            }
            exchange.close();
        });
        server.start();
        base = "http://localhost:" + server.getAddress().getPort();
        builder = new RestClientConfig().restClientBuilder();
    }

    @AfterEach
    void stopServer() {
        server.stop(0);
        MDC.clear();
    }

    private static String studioJson(int id) {
        return "{\"message\":\"ok\",\"data\":{\"id\":" + id + ",\"name\":\"S\",\"plz\":1010,\"isActive\":true}}";
    }

    private StudioClient studioClient() {
        StudioClient client = new StudioClient(builder);
        ReflectionTestUtils.setField(client, "studioServiceBaseUrl", base + "/api/studios");
        return client;
    }

    private AccessCodeClient accessClient() {
        AccessCodeClient client = new AccessCodeClient(builder);
        ReflectionTestUtils.setField(client, "accessServiceBaseUrl", base + "/api/access");
        ReflectionTestUtils.setField(client, "internalServiceKey", "secret-key");
        return client;
    }

    @Test
    void studioIsFetchedFromTheSummaryEndpointAndMappedFromTheEnvelope() {
        stubs.put("/api/studios/7/summary", new Stub(200, """
                {"message":"ok","data":{"id":7,"name":"Studio Sieben","description":"d","street":"s","plz":1010,
                 "city":"Wien","country":"AT","hourlyRateCents":1500,"isActive":true,"imageGalleryBase64":[],
                 "someFieldTheClientDoesNotKnow":"ignored"}}"""));

        StudioDto studio = studioClient().getStudioById(7L);

        assertThat(studio.getName()).isEqualTo("Studio Sieben");
        assertThat(studio.getHourlyRateCents()).isEqualTo(1500);
        assertThat(studio.isActive()).isTrue();
    }

    @Test
    void anUnknownStudioIsReportedAsNotFound() {
        assertThatThrownBy(() -> studioClient().getStudioById(99L)).isInstanceOf(StudioNotFoundException.class);
        assertThat(studioClient().studioExists(99L)).isFalse();
    }

    @Test
    void studioExistsIsTrueForA2xx() {
        stubs.put("/api/studios/7/summary", new Stub(200, studioJson(7)));
        assertThat(studioClient().studioExists(7L)).isTrue();
    }

    @Test
    void aServerErrorBecomesARuntimeExceptionWithContext() {
        stubs.put("/api/studios/7/summary", new Stub(500, "{\"message\":\"boom\",\"data\":null}"));

        assertThatThrownBy(() -> studioClient().getStudioById(7L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Fehler beim Abrufen des Studios");
    }

    @Test
    void theCurrentRequestIdIsPassedOnToTheDownstreamService() {
        stubs.put("/api/studios/7/summary", new Stub(200, studioJson(7)));
        MDC.put(RequestIdFilter.MDC_KEY, "trace-abc-123");

        studioClient().getStudioById(7L);

        assertThat(lastHeaders.get().getFirst("X-Request-Id")).isEqualTo("trace-abc-123");
    }

    @Test
    void noRequestIdHeaderIsSentOutsideARequest() {
        stubs.put("/api/studios/7/summary", new Stub(200, studioJson(7)));

        studioClient().getStudioById(7L);

        assertThat(lastHeaders.get().getFirst("X-Request-Id")).isNull();
    }

    @Test
    void accessCodeCallsCarryTheInternalKeyAndSendJson() {
        stubs.put("/api/access", new Stub(200, "{\"message\":\"ok\",\"data\":{\"accessCode\":\"123456\"}}"));

        var response = accessClient().generateAccessCode(new AccessRequest(5L, 1L, "2026-11-08T10:00", "2026-11-08T12:00"));

        assertThat(response.getAccessCode()).isEqualTo("123456");
        assertThat(lastMethod.get()).isEqualTo("POST");
        assertThat(lastHeaders.get().getFirst("X-Internal-Key")).isEqualTo("secret-key");
        assertThat(lastHeaders.get().getFirst("Content-Type")).contains("application/json");
        assertThat(lastBody.get()).contains("\"bookingId\":5").contains("\"smartlockId\":1");
    }

    @Test
    void aMissingAccessCodeIsNullAndDeletingAMissingOneIsHarmless() {
        assertThat(accessClient().getAccessCode(42L)).isNull();

        stubs.put("/api/access/42", new Stub(400, "{\"message\":\"Access code does not exist\",\"data\":null}"));
        accessClient().deleteAccessCode(42L); // access-service reports a missing code as 400 - must not throw
    }

    @Test
    void aBadRequestFromPaymentCarriesItsMessageToTheCaller() {
        stubs.put("/api/payments/intents", new Stub(400, "{\"message\":\"Gutschein wurde bereits eingelöst\",\"data\":null}"));
        PaymentClient client = new PaymentClient(builder, JsonMapper.builder().build());
        ReflectionTestUtils.setField(client, "paymentServiceBaseUrl", base + "/api/payments");

        assertThatThrownBy(() -> client.createPaymentIntent(new CreatePaymentIntentRequest(1L, 2L, 3L, 1500, java.math.BigDecimal.ONE, null, null, java.time.LocalDate.of(2026, 11, 8), null), "jwt"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Gutschein wurde bereits eingelöst");
        assertThat(lastHeaders.get().getFirst("Authorization")).isEqualTo("Bearer jwt");
    }

    @Test
    void aHangingServiceFailsFastInsteadOfBlockingForever() throws Exception {
        server.removeContext("/");
        server.createContext("/", exchange -> {
            try {
                Thread.sleep(8_000);
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
            }
            exchange.close();
        });

        long start = System.nanoTime();
        assertThatThrownBy(() -> studioClient().getStudioById(1L)).isInstanceOf(RuntimeException.class);
        long seconds = (System.nanoTime() - start) / 1_000_000_000L;

        assertThat(seconds).isLessThan(8);
    }
}
