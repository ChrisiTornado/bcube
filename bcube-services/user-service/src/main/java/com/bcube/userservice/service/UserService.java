package com.bcube.userservice.service;

import com.bcube.userservice.service.dto.response.UserResponse;

public interface UserService {
    UserResponse getUserById(long id);
}