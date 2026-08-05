package com.bcube.bookingservice.security;

import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * The JWT's subject is the user's email (see user-service's JwtTokenProvider), but Booking.userId
 * is numeric, so the token also carries a "userId" claim specifically so this service can check
 * "does this booking belong to the caller" without an extra round-trip to user-service.
 */
public record RequestingUser(Long userId, boolean admin) {

    public static RequestingUser from(Jwt jwt) {
        String rawUserId = jwt.getClaimAsString("userId");
        if (rawUserId == null) {
            // Token predates this claim being added (e.g. still-valid session from just before a
            // rolling deploy) - reject cleanly rather than a raw NumberFormatException, and let
            // the client re-login to get a token that has it.
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sitzung ist veraltet, bitte erneut anmelden");
        }

        List<String> roles = jwt.getClaimAsStringList("roles");
        boolean admin = roles != null && roles.contains("ADMIN");
        return new RequestingUser(Long.valueOf(rawUserId), admin);
    }

    public void requireSelfOrAdmin(Long resourceUserId) {
        if (!admin && !userId.equals(resourceUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Kein Zugriff auf diese Ressource");
        }
    }
}
