package com.example.bcube.service;

import com.example.bcube.service.dto.request.LoginRequest;
import com.example.bcube.service.dto.request.RegisterRequest;
import com.example.bcube.service.dto.response.JwtResponse;

public interface AuthService {
    JwtResponse register(RegisterRequest registerRequest);
    JwtResponse login(LoginRequest loginRequest);
}
