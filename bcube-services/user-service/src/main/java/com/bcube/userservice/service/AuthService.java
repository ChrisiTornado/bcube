package com.bcube.userservice.service;

import com.bcube.userservice.service.dto.request.LoginRequest;
import com.bcube.userservice.service.dto.request.RegisterRequest;
import com.bcube.userservice.service.dto.request.ResetPasswordRequest;
import com.bcube.userservice.service.dto.request.VerifyCodeRequest;
import com.bcube.userservice.service.dto.response.JwtResponse;
import com.bcube.userservice.service.dto.response.ResetPasswordResponse;
import com.bcube.userservice.service.dto.response.VerifyCodeResponse;

public interface AuthService {
    JwtResponse register(RegisterRequest registerRequest);
    JwtResponse login(LoginRequest loginRequest);
    ResetPasswordResponse resetPassword(ResetPasswordRequest resetPasswordRequest);
    VerifyCodeResponse verifyCode(VerifyCodeRequest verifyCodeRequest);
}