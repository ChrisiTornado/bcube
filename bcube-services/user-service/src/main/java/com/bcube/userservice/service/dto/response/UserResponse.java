package com.bcube.userservice.service.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;

@Data
@AllArgsConstructor
public class UserResponse {
    private Long id;
    @JsonProperty("isAdmin")
    private boolean isAdmin;
    private String email;
    private String phone;
    private String firstName;
    private String lastName;
}