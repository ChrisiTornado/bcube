package com.bcube.bookingservice.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

/**
 * Reads X-Forwarded-For first, falling back to the raw socket address.
 *
 * NOTE: behind a reverse proxy/load balancer (e.g. an AWS ALB), X-Forwarded-For can be spoofed by
 * the client unless the proxy is configured to strip any client-supplied value and set its own -
 * that trusted-proxy wiring is a deployment concern to revisit once this actually runs on AWS,
 * not something this class alone can guarantee.
 */
@Component
public class ClientIpResolver {
    public String resolve(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
