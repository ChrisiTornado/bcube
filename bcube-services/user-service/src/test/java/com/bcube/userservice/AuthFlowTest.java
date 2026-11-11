package com.bcube.userservice;

import com.bcube.userservice.persistance.entity.Role;
import com.bcube.userservice.persistance.entity.User;
import com.bcube.userservice.persistance.repository.UserRepository;
import com.bcube.userservice.service.impl.MailService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;

/**
 * The password-reset flow and the rate limits over real HTTP. Every test uses its own email
 * address because the rate limiter is keyed by email and shared across the application context.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
class AuthFlowTest {

    private static final String PASSWORD = "OldPassw0rd!";

    @Value("${local.server.port}")
    private int port;
    @Autowired
    private UserRepository users;
    @Autowired
    private PasswordEncoder encoder;
    @MockitoBean
    private MailService mailService;

    private final HttpClient client = HttpClient.newHttpClient();

    @Test
    void resetFlowChangesThePasswordAndOnlyTheNewOneWorks() throws Exception {
        String email = newUser();

        assertThat(post("/api/auth/reset-password", "{\"email\":\"" + email + "\"}").statusCode()).isEqualTo(200);
        String code = capturedResetCode(email);

        HttpResponse<String> verified = post("/api/auth/verify-code", json(email, "code", code));
        assertThat(verified.statusCode()).isEqualTo(200);
        String token = field(verified.body(), "resetToken");
        assertThat(token).isNotBlank();

        HttpResponse<String> changed = post("/api/auth/change-password",
                "{\"email\":\"" + email + "\",\"resetToken\":\"" + token + "\",\"password\":\"BrandNewPassw0rd!\"}");
        assertThat(changed.statusCode()).isEqualTo(200);

        assertThat(login(email, "BrandNewPassw0rd!").statusCode()).isEqualTo(200);
        assertThat(login(email, PASSWORD).statusCode()).isEqualTo(422);
    }

    @Test
    void theResetTokenWorksOnlyOnce() throws Exception {
        String email = newUser();
        post("/api/auth/reset-password", "{\"email\":\"" + email + "\"}");
        String token = field(post("/api/auth/verify-code", json(email, "code", capturedResetCode(email))).body(), "resetToken");
        String change = "{\"email\":\"" + email + "\",\"resetToken\":\"" + token + "\",\"password\":\"AnotherPassw0rd!\"}";

        assertThat(post("/api/auth/change-password", change).statusCode()).isEqualTo(200);
        assertThat(post("/api/auth/change-password", change).statusCode()).isEqualTo(422);
    }

    @Test
    void knowingTheEmailAloneIsNotEnoughToChangeThePassword() throws Exception {
        String email = newUser();
        post("/api/auth/reset-password", "{\"email\":\"" + email + "\"}");
        // The code is verified, but an attacker only knows the email and guesses a token.
        post("/api/auth/verify-code", json(email, "code", capturedResetCode(email)));

        HttpResponse<String> response = post("/api/auth/change-password",
                "{\"email\":\"" + email + "\",\"resetToken\":\"guessed-token\",\"password\":\"HackedPassw0rd!\"}");

        assertThat(response.statusCode()).isEqualTo(422);
        assertThat(login(email, PASSWORD).statusCode()).isEqualTo(200);
    }

    @Test
    void aWrongCodeAndAnUnknownEmailLookTheSame() throws Exception {
        String known = newUser();
        post("/api/auth/reset-password", "{\"email\":\"" + known + "\"}");

        HttpResponse<String> wrongCode = post("/api/auth/verify-code", json(known, "code", "000000"));
        HttpResponse<String> unknownUser = post("/api/auth/verify-code", json("nobody-" + UUID.randomUUID() + "@example.com", "code", "000000"));

        assertThat(unknownUser.statusCode()).isEqualTo(wrongCode.statusCode());
        assertThat(unknownUser.body()).isEqualTo(wrongCode.body());
    }

    @Test
    void resetRequestsAreRateLimitedPerEmail() throws Exception {
        String email = newUser();
        String body = "{\"email\":\"" + email + "\"}";

        assertThat(post("/api/auth/reset-password", body).statusCode()).isEqualTo(200);
        assertThat(post("/api/auth/reset-password", body).statusCode()).isEqualTo(200);
        assertThat(post("/api/auth/reset-password", body).statusCode()).isEqualTo(200);
        assertThat(post("/api/auth/reset-password", body).statusCode()).isEqualTo(429);
    }

    @Test
    void loginAttemptsAreRateLimitedAndASuccessfulLoginResetsTheCounter() throws Exception {
        String email = newUser();
        for (int i = 0; i < 9; i++) {
            assertThat(login(email, "wrong-" + i).statusCode()).isEqualTo(422);
        }
        assertThat(login(email, PASSWORD).statusCode()).isEqualTo(200);

        for (int i = 0; i < 10; i++) {
            assertThat(login(email, "wrong-again-" + i).statusCode()).isEqualTo(422);
        }
        assertThat(login(email, "one-too-many").statusCode()).isEqualTo(429);
    }

    private String newUser() {
        String email = "user-" + UUID.randomUUID() + "@example.com";
        users.save(User.builder().email(email).password(encoder.encode(PASSWORD))
                .firstName("Test").lastName("Person").phone("+4366012345678").role(Role.USER).build());
        return email;
    }

    private String capturedResetCode(String email) {
        ArgumentCaptor<String> code = ArgumentCaptor.forClass(String.class);
        verify(mailService, atLeastOnce()).sendPasswordResetCode(eq(email), anyString(), code.capture());
        return code.getValue();
    }

    private HttpResponse<String> login(String email, String password) throws Exception {
        return post("/api/auth/login", "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}");
    }

    private HttpResponse<String> post(String path, String json) throws Exception {
        return client.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json)).build(), HttpResponse.BodyHandlers.ofString());
    }

    private static String json(String email, String key, String value) {
        return "{\"email\":\"" + email + "\",\"" + key + "\":\"" + value + "\"}";
    }

    private static String field(String body, String name) {
        Matcher m = Pattern.compile("\"" + name + "\":\"([^\"]+)\"").matcher(body);
        return m.find() ? m.group(1) : null;
    }
}
