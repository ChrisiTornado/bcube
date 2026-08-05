package com.bcube.userservice.service.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "E-Mail-Adresse ist erforderlich")
    @Email(message = "Bitte gib eine gültige E-Mail-Adresse ein")
    private String email;
    @NotBlank(message = "Passwort ist erforderlich")
    @Size(min = 8, message = "Das Passwort muss mindestens 8 Zeichen lang sein")
    private String password;
    @NotBlank(message = "Vorname ist erforderlich")
    private String firstName;
    @NotBlank(message = "Nachname ist erforderlich")
    private String lastName;
    @NotBlank(message = "Telefonnummer ist erforderlich")
    private String phone;
}
