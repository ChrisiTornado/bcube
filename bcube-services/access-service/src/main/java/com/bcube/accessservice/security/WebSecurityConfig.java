package com.bcube.accessservice.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class WebSecurityConfig {
    @Value("${frontend.url}")
    private String frontendUrl;

    /**
     * The api-gateway used to be the only layer setting CORS headers, so every downstream
     * service could safely skip it. Once this bean exists here too, both layers would add
     * Access-Control-Allow-Origin to the same response - browsers reject that as an invalid
     * duplicate value. This is only correct alongside removing the gateway's own CORS bean
     * (see api-gateway's SecurityConfig) so exactly one layer ever sets it - required anyway
     * once a plain ALB (which does no CORS handling at all) replaces the gateway in AWS.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(frontendUrl));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    /**
     * access-service has no user-facing endpoints - every route under /api/access is a
     * server-to-server call from booking-service, authenticated via the shared X-Internal-Key
     * header checked directly in AccessController (same pattern as the internal endpoints in
     * user-service's NotificationController and booking-service's payment-status callback),
     * not by validating an end-user's JWT. There is therefore nothing here for an OAuth2
     * resource server to protect.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/**")
                .csrf(csrf -> csrf.disable())
                .cors(cors -> {})
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .anyRequest().permitAll()
                );
        return http.build();
    }
}
