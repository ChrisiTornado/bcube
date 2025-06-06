package com.example.bcube.controller;

import com.example.bcube.service.dto.ApiResponse;
import com.example.bcube.service.dto.JwtResponse;
import com.example.bcube.service.dto.LoginRequest;
import com.example.bcube.service.dto.RegisterRequest;
import com.example.bcube.service.impl.AuthServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private AuthServiceImpl authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<JwtResponse>> login(@Valid @RequestBody LoginRequest loginRequest) {
        JwtResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(new ApiResponse<>("Login erfolgreich, willkommen zurück " + response.getFirstName() + "!", response));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<JwtResponse>> register(@Valid @RequestBody RegisterRequest registerRequest) {
        JwtResponse response = authService.register(registerRequest);
        return ResponseEntity.ok(new ApiResponse<>("Registrierung erfolgreich, willkommen " + response.getFirstName() + "!", response));
    }
}
