package com.example.bcube.service.dto;

import com.example.bcube.persistence.entity.Role;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class JwtResponse {
    @NotBlank
    private String token;
    private String type = "Bearer";
    private Long id;
    private String email;
    private Role role;
}
