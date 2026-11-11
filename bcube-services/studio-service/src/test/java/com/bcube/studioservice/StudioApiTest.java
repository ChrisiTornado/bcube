package com.bcube.studioservice;

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

/** Exercises the public read API over HTTP against the studio that StudioInitializer seeds. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
class StudioApiTest {

    @Value("${local.server.port}")
    private int port;

    private final HttpClient client = HttpClient.newHttpClient();

    private HttpResponse<byte[]> get(String path, String... headers) throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path));
        if (headers.length > 0) {
            request.headers(headers);
        }
        return client.send(request.GET().build(), HttpResponse.BodyHandlers.ofByteArray());
    }

    @Test
    void listIsSmallBecauseItCarriesThumbnailsOnly() throws Exception {
        HttpResponse<byte[]> response = get("/api/studios/page?page=0&size=10");

        assertThat(response.statusCode()).isEqualTo(200);
        // The seeded studio's five photos used to make this ~20 MB.
        assertThat(response.body().length).isLessThan(500_000);
        assertThat(new String(response.body())).contains("\"thumbnailUrl\":\"/api/studios/");
    }

    @Test
    void summaryHasNoGalleryButKeepsTheBasicData() throws Exception {
        HttpResponse<byte[]> response = get("/api/studios/1/summary");

        assertThat(response.statusCode()).isEqualTo(200);
        String body = new String(response.body());
        assertThat(body).contains("\"hourlyRateCents\":1500").contains("\"imageGalleryBase64\":[]");
        assertThat(response.body().length).isLessThan(100_000);
    }

    @Test
    void detailCarriesTheDisplaySizeGallery() throws Exception {
        HttpResponse<byte[]> response = get("/api/studios/1");

        assertThat(response.statusCode()).isEqualTo(200);
        String body = new String(response.body());
        assertThat(body.split("data:image/jpeg;base64,").length - 1).isGreaterThanOrEqualTo(5);
    }

    @Test
    void imageEndpointServesJpegWithLongLivedCachingAndConditionalGets() throws Exception {
        HttpResponse<byte[]> first = get("/api/studios/1/images/0?size=thumb");

        assertThat(first.statusCode()).isEqualTo(200);
        assertThat(first.headers().firstValue("Content-Type")).hasValue("image/jpeg");
        assertThat(first.headers().firstValue("Cache-Control").orElse("")).contains("immutable").contains("max-age=31536000");
        String etag = first.headers().firstValue("ETag").orElseThrow();

        HttpResponse<byte[]> second = get("/api/studios/1/images/0?size=thumb", "If-None-Match", etag);
        assertThat(second.statusCode()).isEqualTo(304);
        assertThat(second.body()).isEmpty();
    }

    @Test
    void thumbnailIsMuchSmallerThanTheFullImage() throws Exception {
        int thumb = get("/api/studios/1/images/0?size=thumb").body().length;
        int full = get("/api/studios/1/images/0?size=full").body().length;

        assertThat(thumb).isLessThan(full / 3);
    }

    @Test
    void unknownStudioOrImageIsNotFound() throws Exception {
        assertThat(get("/api/studios/999/summary").statusCode()).isEqualTo(404);
        assertThat(get("/api/studios/1/images/42").statusCode()).isEqualTo(404);
    }

    @Test
    void creatingAStudioRequiresAnAdminToken() throws Exception {
        HttpResponse<byte[]> response = client.send(
                HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/admin/studios"))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString("{}")).build(),
                HttpResponse.BodyHandlers.ofByteArray());

        assertThat(response.statusCode()).isEqualTo(401);
    }
}
