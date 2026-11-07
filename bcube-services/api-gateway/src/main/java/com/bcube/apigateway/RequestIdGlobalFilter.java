package com.bcube.apigateway;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Entry point of the correlation ID: keeps a sane client-supplied X-Request-Id, otherwise mints a
 * UUID, forwards it to the downstream service and echoes it in the response so a failing browser
 * request can be matched to the log lines of every service it touched.
 */
@Component
public class RequestIdGlobalFilter implements GlobalFilter, Ordered {

    private static final String HEADER = "X-Request-Id";
    private static final Pattern SAFE = Pattern.compile("[A-Za-z0-9._-]{1,64}");

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String incoming = exchange.getRequest().getHeaders().getFirst(HEADER);
        String requestId = incoming != null && SAFE.matcher(incoming).matches() ? incoming : UUID.randomUUID().toString();

        ServerHttpRequest request = exchange.getRequest().mutate().headers(h -> h.set(HEADER, requestId)).build();
        exchange.getResponse().getHeaders().set(HEADER, requestId);
        return chain.filter(exchange.mutate().request(request).build());
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
