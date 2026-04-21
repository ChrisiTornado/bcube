package com.bcube.userservice.service.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UpdateOwnUserRequest {
    private long id;
    @NotBlank(message = "E-Mail-Adresse ist erforderlich")
    @Email(message = "Bitte gib eine gültige E-Mail-Adresse ein")
    private String email;
    @NotBlank(message = "Vorname ist erforderlich")
    private String firstName;
    @NotBlank(message = "Nachname ist erforderlich")
    private String lastName;
    @NotBlank(message = "Telefonnummer ist erforderlich")
    private String phone;
}
