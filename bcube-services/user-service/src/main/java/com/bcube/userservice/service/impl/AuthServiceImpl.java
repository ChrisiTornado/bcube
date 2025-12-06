package com.bcube.userservice.service.impl;

import com.bcube.userservice.exception.*;
import com.bcube.userservice.persistance.entity.Role;
import com.bcube.userservice.persistance.entity.User;
import com.bcube.userservice.persistance.repository.UserRepository;
import com.bcube.userservice.security.JwtTokenProvider;
import com.bcube.userservice.service.AuthService;
import com.bcube.userservice.service.dto.request.LoginRequest;
import com.bcube.userservice.service.dto.request.RegisterRequest;
import com.bcube.userservice.service.dto.request.ResetPasswordRequest;
import com.bcube.userservice.service.dto.request.VerifyCodeRequest;
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
    @Autowired
    private final UserRepository userRepository;

    @Autowired
    private final AuthenticationManager authenticationManager;

    @Autowired
    private final JwtTokenProvider jwtTokenProvider;

    @Autowired
    private final PasswordEncoder passwordEncoder;

    @Autowired
    private final MailService mailSender;

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

        return authenticateAndCreateJwt(registerRequest.getEmail(), registerRequest.getPassword());
    }

    @Override
    public JwtResponse login(LoginRequest loginRequest) {
        return authenticateAndCreateJwt(loginRequest.getEmail(), loginRequest.getPassword());
    }

    @Override
    public ResetPasswordResponse resetPassword(ResetPasswordRequest resetPasswordRequest) {
        User user = userRepository.findByEmail(resetPasswordRequest.getEmail());
        if (user == null)
            throw new UserNotFoundException("Kein Benutzer mit der E-Mail-Adresse gefunden: " + resetPasswordRequest.getEmail());

        String code = CodeGenerator.generateCode();
        user.setResetCode(code);
        user.setResetCodeExpiresAt(Instant.now().plus(15, ChronoUnit.MINUTES));
        userRepository.save(user);
        mailSender.sendPasswordResetCode(resetPasswordRequest.getEmail(), code);
        return new ResetPasswordResponse(true);
    }

    @Override
    public VerifyCodeResponse verifyCode(VerifyCodeRequest verifyCodeRequest) {
        User user = userRepository.findByEmail(verifyCodeRequest.getEmail());
        if (user == null)
            throw new UserNotFoundException("Ungültige E-Mail-Adresse: " + verifyCodeRequest.getEmail());

        if (user.getResetCode() == null || user.getResetCodeExpiresAt() == null) {
            throw new InvalidResetTokenException("Es ist kein gültiger Reset-Code vorhanden. Bitte fordern Sie einen neuen an.");
        }

        if (user.getResetCodeExpiresAt().isBefore(Instant.now()))
            throw new PasswordResetTokenExpiredException("Der Passwort-Reset-Code ist abgelaufen. Bitte fordern Sie einen neuen an");

        if (!MessageDigest.isEqual(
                user.getResetCode().getBytes(StandardCharsets.UTF_8),
                verifyCodeRequest.getCode().getBytes(StandardCharsets.UTF_8)
        )) {
            throw new InvalidResetTokenException("Der eingegebene Code ist ungültig.");
        }

        return new VerifyCodeResponse(true);
    }

    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new UserNotFoundException("Kein Benutzer mit der E-Mail-Adresse gefunden: " + email);
        }
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
            User user = userRepository.findByEmail(email);
            if (user == null) {
                throw new UserNotFoundException("Benutzer nicht gefunden: " + email);
            }
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
                userDetails.getFirstName());
    }
}