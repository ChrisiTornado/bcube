package com.bcube.userservice.service.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AdminUpdateUserRequest {
    private long id;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private boolean isAdmin;
}