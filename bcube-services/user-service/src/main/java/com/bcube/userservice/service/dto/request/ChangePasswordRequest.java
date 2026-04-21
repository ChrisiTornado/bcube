package com.bcube.userservice.service.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ChangePasswordRequest {
    @NotBlank(message = "E-Mail-Adresse ist erforderlich")
    @Email(message = "Bitte gib eine gültige E-Mail-Adresse ein")
    private String email;
    @NotBlank(message = "Passwort ist erforderlich")
    private String password;
}
