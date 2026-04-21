package com.bcube.userservice.service.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "E-Mail-Adresse ist erforderlich")
    @Email(message = "Bitte gib eine gültige E-Mail-Adresse ein")
    private String email;
    @NotBlank(message = "Passwort ist erforderlich")
    private String password;
    @NotBlank(message = "Vorname ist erforderlich")
    private String firstName;
    @NotBlank(message = "Nachname ist erforderlich")
    private String lastName;
    @NotBlank(message = "Telefonnummer ist erforderlich")
    private String phone;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

}
