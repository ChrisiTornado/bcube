package com.bcube.userservice.service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class VerifyCodeResponse {
    private boolean success;
    /** Single-use token that change-password requires as proof the code was verified. */
    private String resetToken;
}
