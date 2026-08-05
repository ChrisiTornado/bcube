package com.bcube.userservice.service.impl;

import com.bcube.userservice.client.PaymentClient;
import com.bcube.userservice.exception.*;
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
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailSender;
    private final PaymentClient paymentClient;

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
        return authenticateAndCreateJwt(loginRequest.getEmail(), loginRequest.getPassword());
    }

    @Override
    public ResetPasswordResponse resetPassword(ResetPasswordRequest resetPasswordRequest) {
        // Deliberately doesn't throw/leak whether the email is registered - always returns the
        // same success response, only actually sending a code when an account exists. Otherwise
        // this endpoint would let anyone probe which emails have a bcube account.
        userRepository.findByEmail(resetPasswordRequest.getEmail()).ifPresent(user -> {
            String code = CodeGenerator.generateCode();
            user.setResetCode(passwordEncoder.encode(code));
            user.setResetCodeExpiresAt(Instant.now().plus(15, ChronoUnit.MINUTES));
            userRepository.save(user);
            mailSender.sendPasswordResetCode(resetPasswordRequest.getEmail(), user.getFirstName(), code);
        });
        return new ResetPasswordResponse(true);
    }

    @Override
    public VerifyCodeResponse verifyCode(VerifyCodeRequest verifyCodeRequest) {
        User user = userRepository.findByEmail(verifyCodeRequest.getEmail())
                .orElseThrow(() -> new UserNotFoundException("Kein Benutzer mit der E-Mail-Adresse gefunden: " + verifyCodeRequest.getEmail()));

        if (user.getResetCode() == null || user.getResetCodeExpiresAt() == null) {
            throw new InvalidResetTokenException("Es ist kein gültiger Reset-Code vorhanden. Bitte fordern Sie einen neuen an.");
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
            throw new InvalidResetTokenException("Der eingegebene Code ist ungültig.");
        }

        user.setResetCode(null);
        user.setResetCodeExpiresAt(null);
        user.setResetVerifiedAt(Instant.now());
        userRepository.save(user);
        return new VerifyCodeResponse(true);
    }

    @Override
    public ChangePasswordResponse changePassword(ChangePasswordRequest changePasswordRequest) {
        User user = userRepository.findByEmail(changePasswordRequest.getEmail())
                .orElseThrow(() -> new UserNotFoundException("Kein Benutzer mit der E-Mail-Adresse gefunden: " + changePasswordRequest.getEmail()));

        if (user.getResetVerifiedAt() == null) {
            throw new InvalidResetTokenException("Bitte bestätige zuerst den Reset-Code, bevor du ein neues Passwort setzt.");
        }

        if (user.getResetVerifiedAt().isBefore(Instant.now().minus(15, ChronoUnit.MINUTES))) {
            user.setResetVerifiedAt(null);
            userRepository.save(user);
            throw new PasswordResetTokenExpiredException("Die Bestätigung ist abgelaufen. Bitte fordere einen neuen Code an.");
        }

        user.setPassword(passwordEncoder.encode(changePasswordRequest.getPassword()));
        user.setResetVerifiedAt(null);
        userRepository.save(user);
        mailSender.sendPasswordChangedConfirmation(user.getEmail(), user.getFirstName());
        return new ChangePasswordResponse(true);
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
        } catch (Exception ex) {
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

        String jwt = jwtTokenProvider.generateToken(userDetails.getUsername(), roles);

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