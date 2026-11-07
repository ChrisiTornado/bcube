package com.bcube.accessservice.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;

/**
 * Authenticates the one legitimate caller of /api/access/** (booking-service) by the shared
 * X-Internal-Key header, compared in constant time. A valid key becomes an authenticated
 * principal with ROLE_INTERNAL, so the security chain can require it per route and deny
 * everything else - a new endpoint is closed by default instead of relying on a check inside
 * each controller method.
 */
public class InternalKeyFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Internal-Key";

    private final byte[] expectedKey;

    public InternalKeyFilter(String internalServiceKey) {
        this.expectedKey = internalServiceKey.getBytes(StandardCharsets.UTF_8);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String provided = request.getHeader(HEADER);
        if (provided != null && MessageDigest.isEqual(provided.getBytes(StandardCharsets.UTF_8), expectedKey)) {
            SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                    "booking-service", null, List.of(new SimpleGrantedAuthority("ROLE_INTERNAL"))));
        }
        chain.doFilter(request, response);
    }
}
