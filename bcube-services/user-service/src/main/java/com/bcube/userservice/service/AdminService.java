package com.bcube.userservice.service;

import com.bcube.userservice.service.dto.request.AdminUpdateUserRequest;
import com.bcube.userservice.service.dto.response.UserNameResponse;
import com.bcube.userservice.service.dto.response.UserResponse;
import org.springframework.data.domain.Page;

public interface AdminService {
    Page<UserResponse> getAllUsers(int page, int size);
    void deleteUser(long id, String token);
    UserResponse updateUser(long id, AdminUpdateUserRequest adminUpdateUserRequest);
    Page<UserNameResponse> getUserNamesOfBookings(int page, int size);
}