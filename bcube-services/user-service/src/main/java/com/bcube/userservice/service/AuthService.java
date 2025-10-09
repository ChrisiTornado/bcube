package com.bcube.userservice.service;

import com.bcube.userservice.service.dto.request.LoginRequest;
import com.bcube.userservice.service.dto.request.RegisterRequest;
import com.bcube.userservice.service.dto.response.JwtResponse;

public interface AuthService {
    JwtResponse register(RegisterRequest registerRequest);
    JwtResponse login(LoginRequest loginRequest);
}