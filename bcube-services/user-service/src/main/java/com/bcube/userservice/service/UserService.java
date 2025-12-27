package com.bcube.userservice.service;

import com.bcube.userservice.service.dto.request.CreateUserRequest;
import com.bcube.userservice.service.dto.request.UpdateUserRequest;
import com.bcube.userservice.service.dto.response.UserResponse;
import org.springframework.data.domain.Page;

public interface UserService {
    Page<UserResponse> getAllUsers(int page, int size);
    UserResponse createUser(CreateUserRequest createUserRequest);
    void deleteUser(long id);
    UserResponse updateUser(long id, UpdateUserRequest updateUserRequest);
    UserResponse getUserById(long id);
}