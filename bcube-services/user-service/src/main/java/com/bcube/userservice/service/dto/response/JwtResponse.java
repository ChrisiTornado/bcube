package com.bcube.userservice.service.dto.response;

import com.bcube.userservice.persistance.entity.AuthProvider;
import com.bcube.userservice.persistance.entity.Role;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;

@Data
@AllArgsConstructor
public class JwtResponse {
    @NotBlank
    private String token;
    private String type = "Bearer";
    private Long id;
    private String email;
    private Role role;
    private String firstName;
    private String lastName;
    private String phone;
    private AuthProvider authProvider;
}