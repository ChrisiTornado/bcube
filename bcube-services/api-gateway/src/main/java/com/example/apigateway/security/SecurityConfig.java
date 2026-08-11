package com.example.apigateway.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.util.matcher.ServerWebExchangeMatchers;

/**
 * CORS is deliberately NOT handled here anymore - every downstream service now sets its own
 * Access-Control-Allow-Origin (see each service's WebSecurityConfig). Having both this gateway
 * and the downstream service each add the header made browsers see a duplicated value and
 * reject the response outright. This also lines up with the AWS plan: once a plain ALB (which
 * does no CORS handling of its own) replaces this gateway, each service already owns its CORS
 * config with nothing left to migrate.
 */
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    /**
     * Public routes get their own filter chain with no oauth2ResourceServer at all. permitAll()
     * on the main chain only skips the authorization check - the JWT filter still runs and tries
     * to validate any Authorization header present, so a stray/expired bearer token (e.g. left
     * over in the browser from a previous session) breaks login/register/webhooks even though
     * they never need auth. Matched first (Order 1) so these paths never reach that filter.
     */
    @Bean
    @Order(1)
    public SecurityWebFilterChain publicSecurityWebFilterChain(ServerHttpSecurity http) {
        return http
                .securityMatcher(ServerWebExchangeMatchers.pathMatchers(
                        "/actuator/health",
                        "/api/auth/**",
                        "/api/payments/webhook",
                        "/oauth2/**",
                        "/login/**"
                ))
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(exchange -> exchange.anyExchange().permitAll())
                .build();
    }

    @Bean
    @Order(2)
    public SecurityWebFilterChain securityWebFilterChain(
            ServerHttpSecurity http,
            org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverter jwtAuthConverter
    ) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(exchange -> exchange
                        .pathMatchers(HttpMethod.OPTIONS).permitAll()
                        .pathMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyExchange().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthConverter))
                )
                .build();
    }
}
