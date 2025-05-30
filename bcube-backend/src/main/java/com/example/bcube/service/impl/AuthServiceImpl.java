package com.example.bcube.service.impl;

import com.example.bcube.exception.EmailAlreadyTakenException;
import com.example.bcube.exception.InvalidCredentialsException;
import com.example.bcube.exception.UserNotFoundException;
import com.example.bcube.persistence.entity.Role;
import com.example.bcube.persistence.entity.User;
import com.example.bcube.persistence.repository.UserRepository;
import com.example.bcube.security.JwtTokenProvider;
import com.example.bcube.service.AuthService;
import com.example.bcube.service.dto.JwtResponse;
import com.example.bcube.service.dto.LoginRequest;
import com.example.bcube.service.dto.RegisterRequest;
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

import java.util.Collections;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private final PasswordEncoder passwordEncoder;

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

        String jwt = jwtTokenProvider.generateToken(userDetails.getUsername());

        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        return new JwtResponse(jwt,
                "Bearer",
                userDetails.getId(),
                userDetails.getEmail(),
                userDetails.getRole(),
                userDetails.getFirstName());
    }
}
