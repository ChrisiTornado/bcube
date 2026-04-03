package com.bcube.userservice.service;

import com.bcube.userservice.service.dto.request.UpdateOwnUserRequest;
import com.bcube.userservice.service.dto.response.UserResponse;

public interface UserService {
    UserResponse getUserById(long id);
    UserResponse updateUserById(String email, UpdateOwnUserRequest updateOwnUserRequest);
}