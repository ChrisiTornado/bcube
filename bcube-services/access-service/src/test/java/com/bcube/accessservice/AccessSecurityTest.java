package com.bcube.accessservice;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;

/** access-service is internal only: every route is closed unless the caller presents the internal key. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
class AccessSecurityTest {

    private static final String KEY = "test-internal-key";

    @Value("${local.server.port}")
    private int port;

    private final HttpClient client = HttpClient.newHttpClient();

    private int status(String method, String path, String... headers) throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
                .method(method, HttpRequest.BodyPublishers.noBody());
        if (headers.length > 0) {
            request.headers(headers);
        }
        return client.send(request.build(), HttpResponse.BodyHandlers.discarding()).statusCode();
    }

    @Test
    void withoutTheKeyEveryAccessRouteIsForbidden() throws Exception {
        assertThat(status("GET", "/api/access/1")).isEqualTo(403);
        assertThat(status("DELETE", "/api/access/1")).isEqualTo(403);
        assertThat(status("POST", "/api/access")).isEqualTo(403);
    }

    @Test
    void aWrongKeyIsForbidden() throws Exception {
        assertThat(status("GET", "/api/access/1", "X-Internal-Key", "nope")).isEqualTo(403);
    }

    @Test
    void theCorrectKeyReachesTheController() throws Exception {
        // 400: the controller ran and reported that code 1 does not exist (not a security rejection).
        assertThat(status("GET", "/api/access/1", "X-Internal-Key", KEY)).isEqualTo(400);
    }

    @Test
    void anyOtherPathStaysClosedEvenWithTheKey() throws Exception {
        assertThat(status("GET", "/api/anything-else", "X-Internal-Key", KEY)).isEqualTo(403);
        assertThat(status("GET", "/", "X-Internal-Key", KEY)).isEqualTo(403);
    }

    @Test
    void healthStaysPublic() throws Exception {
        assertThat(status("GET", "/actuator/health")).isEqualTo(200);
    }
}
