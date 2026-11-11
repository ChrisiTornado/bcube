package com.bcube.userservice.service.impl;

import com.bcube.userservice.client.PaymentClient;
import com.bcube.userservice.exception.*;
import com.bcube.userservice.security.RateLimiter;
import com.bcube.userservice.persistance.entity.Role;
import com.bcube.userservice.persistance.entity.User;
import com.bcube.userservice.persistance.repository.UserRepository;
import com.bcube.userservice.security.JwtTokenProvider;
import com.bcube.userservice.service.AuthService;
import com.bcube.userservice.service.dto.request.*;
import com.bcube.userservice.service.dto.response.ChangePasswordResponse;
import com.bcube.userservice.service.dto.response.JwtResponse;
import com.bcube.userservice.service.dto.response.ResetPasswordResponse;
import com.bcube.userservice.service.dto.response.VerifyCodeResponse;
import com.bcube.userservice.utility.CodeGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private static final int MAX_RESET_CODE_ATTEMPTS = 5;

    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailSender;
    private final PaymentClient paymentClient;
    private final RateLimiter rateLimiter;
    private final SecureRandom secureRandom = new SecureRandom();

    private static final int MAX_LOGIN_ATTEMPTS = 10;
    private static final int MAX_RESET_REQUESTS = 3;
    private static final int MAX_RESET_STEPS = 10;

    @Override
    public JwtResponse register(RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new EmailAlreadyTakenException("E-Mail-Adresse ist bereits registriert.");
        }

        User user = User.builder()
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .firstName(registerRequest.getFirstName())
                .lastName(registerRequest.getLastName())
                .phone(registerRequest.getPhone())
                .role(Role.USER)
                .build();

        userRepository.save(user);

        JwtResponse jwtResponse = authenticateAndCreateJwt(registerRequest.getEmail(), registerRequest.getPassword());
        paymentClient.grantWelcomeVoucher(jwtResponse.getId(), registerRequest.getPhone(), jwtResponse.getToken());
        mailSender.sendWelcomeEmail(user.getEmail(), user.getFirstName());

        return jwtResponse;
    }

    @Override
    public JwtResponse login(LoginRequest loginRequest) {
        rateLimiter.check("login", loginRequest.getEmail(), MAX_LOGIN_ATTEMPTS);
        JwtResponse response = authenticateAndCreateJwt(loginRequest.getEmail(), loginRequest.getPassword());
        rateLimiter.reset("login", loginRequest.getEmail());
        return response;
    }

    @Override
    public ResetPasswordResponse resetPassword(ResetPasswordRequest resetPasswordRequest) {
        // Deliberately doesn't throw/leak whether the email is registered - always returns the
        // same success response, only actually sending a code when an account exists. Otherwise
        // this endpoint would let anyone probe which emails have a bcube account.
        rateLimiter.check("reset-password", resetPasswordRequest.getEmail(), MAX_RESET_REQUESTS);
        userRepository.findByEmail(resetPasswordRequest.getEmail()).ifPresent(user -> {
            String code = CodeGenerator.generateCode();
            user.setResetCode(passwordEncoder.encode(code));
            user.setResetCodeExpiresAt(Instant.now().plus(15, ChronoUnit.MINUTES));
            user.setResetCodeAttempts(0);
            userRepository.save(user);
            mailSender.sendPasswordResetCode(resetPasswordRequest.getEmail(), user.getFirstName(), code);
        });
        return new ResetPasswordResponse(true);
    }

    @Override
    public VerifyCodeResponse verifyCode(VerifyCodeRequest verifyCodeRequest) {
        rateLimiter.check("verify-code", verifyCodeRequest.getEmail(), MAX_RESET_STEPS);
        // An unknown email gets the exact same answer as a wrong code, so this endpoint cannot be
        // used to find out which emails have an account.
        User user = userRepository.findByEmail(verifyCodeRequest.getEmail())
                .orElseThrow(() -> new InvalidResetTokenException("Der eingegebene Code ist ungültig."));

        if (user.getResetCode() == null || user.getResetCodeExpiresAt() == null) {
            throw new InvalidResetTokenException("Der eingegebene Code ist ungültig.");
        }

        if (user.getResetCodeExpiresAt().isBefore(Instant.now())) {
            user.setResetCode(null);
            user.setResetCodeExpiresAt(null);
            userRepository.save(user);
            throw new PasswordResetTokenExpiredException("Der Passwort-Reset-Code ist abgelaufen. Bitte fordern Sie einen neuen an");
        }

        if (!passwordEncoder.matches(
                verifyCodeRequest.getCode(),
                user.getResetCode()
        )) {
            user.setResetCodeAttempts(user.getResetCodeAttempts() + 1);
            if (user.getResetCodeAttempts() >= MAX_RESET_CODE_ATTEMPTS) {
                user.setResetCode(null);
                user.setResetCodeExpiresAt(null);
                user.setResetCodeAttempts(0);
                userRepository.save(user);
                throw new InvalidResetTokenException("Zu viele Fehlversuche. Bitte fordere einen neuen Code an.");
            }
            userRepository.save(user);
            throw new InvalidResetTokenException("Der eingegebene Code ist ungültig.");
        }

        // Code is correct: it is consumed and exchanged for a single-use token that
        // change-password must present, so knowing the email alone is never enough.
        byte[] raw = new byte[32];
        secureRandom.nextBytes(raw);
        String resetToken = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);

        user.setResetCode(null);
        user.setResetCodeExpiresAt(null);
        user.setResetCodeAttempts(0);
        user.setResetVerifiedAt(Instant.now());
        user.setResetTokenHash(sha256(resetToken));
        userRepository.save(user);

        return new VerifyCodeResponse(true, resetToken);
    }

    @Override
    public ChangePasswordResponse changePassword(ChangePasswordRequest changePasswordRequest) {
        rateLimiter.check("change-password", changePasswordRequest.getEmail(), MAX_RESET_STEPS);
        User user = userRepository.findByEmail(changePasswordRequest.getEmail())
                .orElseThrow(() -> new InvalidResetTokenException("Der Reset-Link ist ungültig. Bitte fordere einen neuen Code an."));

        if (user.getResetVerifiedAt() == null || user.getResetTokenHash() == null
                || !MessageDigest.isEqual(
                        sha256(changePasswordRequest.getResetToken()).getBytes(StandardCharsets.UTF_8),
                        user.getResetTokenHash().getBytes(StandardCharsets.UTF_8))) {
            throw new InvalidResetTokenException("Der Reset-Link ist ungültig. Bitte fordere einen neuen Code an.");
        }

        if (user.getResetVerifiedAt().isBefore(Instant.now().minus(15, ChronoUnit.MINUTES))) {
            user.setResetVerifiedAt(null);
            user.setResetTokenHash(null);
            userRepository.save(user);
            throw new PasswordResetTokenExpiredException("Die Bestätigung ist abgelaufen. Bitte fordere einen neuen Code an.");
        }

        user.setPassword(passwordEncoder.encode(changePasswordRequest.getPassword()));
        user.setResetVerifiedAt(null);
        user.setResetTokenHash(null);
        userRepository.save(user);

        mailSender.sendPasswordChangedConfirmation(user.getEmail(), user.getFirstName());
        return new ChangePasswordResponse(true);
    }

    private static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Kein Benutzer mit der E-Mail-Adresse gefunden: " + email));
        return UserDetailsImpl.build(user);
    }

    private JwtResponse authenticateAndCreateJwt(String email, String password) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );
        } catch (org.springframework.security.core.AuthenticationException ex) {
            // Genuine wrong-credentials/unknown-user/locked-account cases only - anything else
            // (e.g. a data-mapping error while loading the user) should surface as a real error
            // instead of being misreported as "wrong password", which made a previous data bug
            // here (a NOT NULL column holding NULL rows) completely invisible from the outside.
            throw new InvalidCredentialsException("Falsche Benutzerdaten");
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);
        Object principal = authentication.getPrincipal();
        UserDetailsImpl userDetails;

        if (principal instanceof UserDetailsImpl) {
            userDetails = (UserDetailsImpl) principal;
        } else {
            // Backup-Fall: userDetails manuell aus DB holen
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new UserNotFoundException("Kein Benutzer mit der E-Mail-Adresse gefunden: " + email));
            userDetails = UserDetailsImpl.build(user);
        }

        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        String jwt = jwtTokenProvider.generateToken(userDetails.getUsername(), userDetails.getId(), roles);

        return new JwtResponse(jwt,
                "Bearer",
                userDetails.getId(),
                userDetails.getEmail(),
                userDetails.getRole(),
                userDetails.getFirstName(),
                userDetails.getLastName(),
                userDetails.getPhone(),
                userDetails.getAuthProvider());
    }
}