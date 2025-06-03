package com.example.bcube.service;

import com.example.bcube.service.dto.*;

public interface UserService {
    UserResponse[] getAllUsers();
    UserResponse createUser(CreateUserRequest createUserRequest);
    void deleteUser(long id);
    UserResponse updateUser(long id, UpdateUserRequest updateUserRequest);
}
