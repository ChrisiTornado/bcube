package com.bcube.bookingservice.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

/**
 * Mints a short-lived token for the payment-webhook -> access-service leg of the
 * payment-status callback, where there is no real user JWT to forward. Every service
 * already implicitly trusts holders of the shared jwt.secret (it's copy-pasted into
 * every service's config), so this formalizes an existing trust boundary rather than
 * adding a new one.
 */
@Component
public class InternalTokenProvider {
    @Value("${jwt.secret}")
    private String jwtSecret;

    private SecretKey key;

    @PostConstruct
    public void init() {
        this.key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateSystemToken() {
        Date now = new Date();
        return Jwts.builder()
                .subject("system:payment-webhook")
                .claim("roles", List.of("ADMIN"))
                .issuedAt(now)
                .expiration(new Date(now.getTime() + 60_000))
                // Explicit HS256 - jjwt 0.12+'s single-arg signWith(key) picks the strongest
                // algorithm the key size allows, which silently produced HS512 here (our shared
                // secret is long) and broke every other service's HS256-only NimbusJwtDecoder.
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }
}
