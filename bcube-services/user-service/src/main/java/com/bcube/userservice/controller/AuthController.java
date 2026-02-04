package com.bcube.userservice.controller;

import com.bcube.userservice.service.AuthService;
import com.bcube.userservice.service.dto.request.*;
import com.bcube.userservice.service.dto.response.*;
import com.bcube.userservice.service.impl.AuthServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private AuthService authService;

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

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<ResetPasswordResponse>> resetPassword(@Valid @RequestBody ResetPasswordRequest resetPasswordRequest) {
        ResetPasswordResponse response = authService.resetPassword(resetPasswordRequest);
        return ResponseEntity.ok(new ApiResponse<>("Code erfolgreich gesendet",  response));
    }

    @PostMapping("/verify-code")
    public ResponseEntity<ApiResponse<VerifyCodeResponse>> verifyCode(@Valid @RequestBody VerifyCodeRequest verifyCodeRequest) {
        VerifyCodeResponse response = authService.verifyCode(verifyCodeRequest);
        return ResponseEntity.ok(new ApiResponse<>("Code bestätigt", response));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<ChangePasswordResponse>> changePassword(@Valid @RequestBody ChangePasswordRequest changePasswordRequest) {
        ChangePasswordResponse response = authService.changePassword(changePasswordRequest);
        return ResponseEntity.ok(new ApiResponse<>("Neues Passwort gespeichert", response));
    }
}