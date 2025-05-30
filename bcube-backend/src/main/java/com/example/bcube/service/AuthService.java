package com.example.bcube.service;

import com.example.bcube.service.dto.*;

public interface AuthService {
    JwtResponse register(RegisterRequest registerRequest);
    JwtResponse login(LoginRequest loginRequest);
}
