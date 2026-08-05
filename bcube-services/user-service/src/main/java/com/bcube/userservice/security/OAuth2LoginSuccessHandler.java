package com.bcube.userservice.security;

import com.bcube.userservice.persistance.entity.AuthProvider;
import com.bcube.userservice.persistance.entity.Role;
import com.bcube.userservice.persistance.entity.User;
import com.bcube.userservice.persistance.repository.UserRepository;
import com.bcube.userservice.service.impl.MailService;
import com.bcube.userservice.service.impl.UserDetailsImpl;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * Google's id-token never exposes a phone number and only sometimes exposes given/family name, so
 * the frontend needs to know whether the profile it just logged into is actually complete. Rather
 * than a JSON API response (this handler runs at the end of a browser redirect chain, not an XHR),
 * the outcome - including the JWT - is handed back via the URL fragment so it never lands in
 * server access logs or the Referer header.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final MailService mailService;

    @Value("${frontend.url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String sub = oAuth2User.getName();
        String email = oAuth2User.getAttribute("email");
        Boolean emailVerified = oAuth2User.getAttribute("email_verified");
        String givenName = oAuth2User.getAttribute("given_name");
        String familyName = oAuth2User.getAttribute("family_name");

        if (email == null || Boolean.FALSE.equals(emailVerified)) {
            response.sendRedirect(frontendUrl + "/login#error=oauth_email_unverified");
            return;
        }

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            user = User.builder()
                    .email(email)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .firstName(givenName)
                    .lastName(familyName)
                    .phone(null)
                    .role(Role.USER)
                    .authProvider(AuthProvider.GOOGLE)
                    .providerId(sub)
                    .build();
            userRepository.save(user);
            mailService.sendWelcomeEmail(user.getEmail(), user.getFirstName() != null ? user.getFirstName() : "");
        } else if (user.getAuthProvider() == null || user.getAuthProvider() == AuthProvider.LOCAL) {
            user.setAuthProvider(AuthProvider.GOOGLE);
            user.setProviderId(sub);
            userRepository.save(user);
        }

        UserDetailsImpl userDetails = UserDetailsImpl.build(user);
        List<String> roles = userDetails.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();
        String jwt = jwtTokenProvider.generateToken(userDetails.getUsername(), userDetails.getId(), roles);

        boolean profileComplete = isNotBlank(user.getPhone()) && isNotBlank(user.getFirstName()) && isNotBlank(user.getLastName());

        String redirectUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/auth/oauth-callback")
                .fragment("token={token}&id={id}&email={email}&role={role}&firstName={firstName}&lastName={lastName}&phone={phone}&profileComplete={profileComplete}&authProvider={authProvider}")
                .buildAndExpand(
                        jwt,
                        user.getId(),
                        user.getEmail(),
                        user.getRole().name(),
                        user.getFirstName() != null ? user.getFirstName() : "",
                        user.getLastName() != null ? user.getLastName() : "",
                        user.getPhone() != null ? user.getPhone() : "",
                        profileComplete,
                        user.getAuthProvider().name()
                )
                .encode()
                .toUriString();

        response.sendRedirect(redirectUrl);
    }

    private boolean isNotBlank(String value) {
        return value != null && !value.isBlank();
    }
}
