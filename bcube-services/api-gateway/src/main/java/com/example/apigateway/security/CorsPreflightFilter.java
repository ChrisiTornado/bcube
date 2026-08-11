package com.example.apigateway.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

/**
 * Answers CORS preflight (OPTIONS) requests directly instead of routing them downstream or
 * relying on Spring Cloud Gateway's globalcors config. That config registers a generic
 * CorsConfigurationSource which Spring's WebFlux CORS machinery then applies to every matching
 * request AND response - including the actual (non-preflight) routed response, which already
 * gets its own Access-Control-Allow-Origin header from the downstream service (each service owns
 * its own CORS per its WebSecurityConfig). That duplication is exactly the bug that got gateway's
 * CORS handling removed in the first place. Running at the highest WebFilter precedence, this
 * short-circuits only genuine preflight requests before Spring Security or gateway routing ever
 * see them; every other request passes through untouched.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorsPreflightFilter implements WebFilter {

    @Value("${frontend.url}")
    private String frontendUrl;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String requestedMethod = request.getHeaders().getFirst("Access-Control-Request-Method");

        if (request.getMethod() == HttpMethod.OPTIONS && requestedMethod != null) {
            ServerHttpResponse response = exchange.getResponse();
            HttpHeaders headers = response.getHeaders();
            headers.add("Access-Control-Allow-Origin", frontendUrl);
            headers.add("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
            String requestedHeaders = request.getHeaders().getFirst("Access-Control-Request-Headers");
            headers.add("Access-Control-Allow-Headers", requestedHeaders != null ? requestedHeaders : "*");
            headers.add("Access-Control-Allow-Credentials", "true");
            response.setStatusCode(HttpStatus.OK);
            return response.setComplete();
        }

        return chain.filter(exchange);
    }
}
