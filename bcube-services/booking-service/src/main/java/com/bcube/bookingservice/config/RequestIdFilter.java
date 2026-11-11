package com.bcube.bookingservice.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Correlation ID for tracing one request across services. Reuses the caller's X-Request-Id when it
 * looks sane (the gateway sets one), otherwise mints a UUID. It is put into the MDC (printed via
 * logging.pattern.correlation / included in structured logs), echoed in the response, and passed
 * on by {@link #propagate()} for outgoing RestClient calls. Duplicated per service on purpose -
 * services stay independently buildable.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestIdFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Request-Id";
    public static final String MDC_KEY = "requestId";
    private static final Pattern SAFE = Pattern.compile("[A-Za-z0-9._-]{1,64}");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String incoming = request.getHeader(HEADER);
        String requestId = incoming != null && SAFE.matcher(incoming).matches() ? incoming : UUID.randomUUID().toString();
        MDC.put(MDC_KEY, requestId);
        response.setHeader(HEADER, requestId);
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_KEY);
        }
    }

    /** Adds the current request's ID to outgoing RestClient requests (runs on the calling thread). */
    public static ClientHttpRequestInterceptor propagate() {
        return (request, body, execution) -> {
            String requestId = MDC.get(MDC_KEY);
            if (requestId != null) {
                request.getHeaders().set(HEADER, requestId);
            }
            return execution.execute(request, body);
        };
    }
}
