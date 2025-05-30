package com.example.bcube.service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
public class RegisterRequest {
    @NotBlank(message = "Email is required.")
    @Email
    private String email;
    @NotBlank(message = "Password is required.")
    private String password;
    @NotBlank(message = "firstname is required.")
    private String firstName;
    @NotBlank(message = "lastname is required.")
    private String lastName;
    @NotBlank(message = "phone number is required.")
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
