package com.bcube.userservice.controller;

import com.bcube.userservice.service.AdminService;
import com.bcube.userservice.service.dto.request.CreateUserRequest;
import com.bcube.userservice.service.dto.request.AdminUpdateUserRequest;
import com.bcube.userservice.service.dto.response.ApiResponse;
import com.bcube.userservice.service.dto.response.UserNameResponse;
import com.bcube.userservice.service.dto.response.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/users")
public class AdminController {
    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<UserResponse>>> getAllUsers(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        Page<UserResponse> response = adminService.getAllUsers(page, size);
        return ResponseEntity.ok(new ApiResponse<>("Users erfolgreich gesendet", response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@Valid @RequestBody CreateUserRequest createUserRequest) {
        UserResponse response = adminService.createUser(createUserRequest);
        return ResponseEntity.ok(new ApiResponse<>("User erfolgreich erstellt", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable long id,
            @RequestHeader("Authorization") String authorizationHeader
    ) {
        adminService.deleteUser(id, authorizationHeader.replace("Bearer ", ""));
        return ResponseEntity.ok(new ApiResponse<>("User erfolgreich gelöscht", null));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(@PathVariable long id, @Valid @RequestBody AdminUpdateUserRequest adminUpdateUserRequest) {
        UserResponse response = adminService.updateUser(id, adminUpdateUserRequest);
        return ResponseEntity.ok(new ApiResponse<>("User erfolgreich aktuallisiert", response));
    }

    @GetMapping("/filters")
    public ResponseEntity<ApiResponse<Page<UserNameResponse>>> getBookingsNames(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        Page<UserNameResponse> names = adminService.getUserNamesOfBookings(page, size);
        return ResponseEntity.ok(new ApiResponse<>("Usernamen erfolgreich geladen", names));
    }
}