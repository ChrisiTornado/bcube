package com.example.bcube.service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UpdateUserRequest {
    private long id;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private boolean isAdmin;
}
