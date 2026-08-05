package com.bcube.userservice.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

/**
 * The Google sign-in redirect dance (browser -> Google -> back to /login/oauth2/code/google) needs
 * a session to hold the authorization request/state+PKCE across those hops, unlike the rest of this
 * API which is fully stateless JWT. Splitting it into its own, higher-precedence filter chain keeps
 * that session scoped to just these two paths - it's never touched again once the handler below
 * redirects the browser back to the frontend with our own JWT.
 */
@Configuration
@RequiredArgsConstructor
public class OAuth2LoginSecurityConfig {
    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

    @Value("${frontend.url}")
    private String frontendUrl;

    @Bean
    @Order(1)
    public SecurityFilterChain oauth2LoginSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/oauth2/**", "/login/**")
                .csrf(csrf -> csrf.disable())
                .cors(cors -> {})
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(oAuth2LoginSuccessHandler)
                        .failureHandler((request, response, exception) ->
                                response.sendRedirect(frontendUrl + "/login#error=oauth"))
                );

        return http.build();
    }
}
