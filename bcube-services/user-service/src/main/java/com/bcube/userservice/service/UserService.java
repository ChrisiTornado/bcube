package com.bcube.userservice.service;

import com.bcube.userservice.service.dto.request.CreateUserRequest;
import com.bcube.userservice.service.dto.request.UpdateUserRequest;
import com.bcube.userservice.service.dto.response.UserResponse;

public interface UserService {
    UserResponse[] getAllUsers();
    UserResponse createUser(CreateUserRequest createUserRequest);
    void deleteUser(long id);
    UserResponse updateUser(long id, UpdateUserRequest updateUserRequest);
    UserResponse getUserById(long id);
}