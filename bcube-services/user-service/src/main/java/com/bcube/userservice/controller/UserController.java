package com.bcube.userservice.controller;

import com.bcube.userservice.service.dto.request.CreateUserRequest;
import com.bcube.userservice.service.dto.request.UpdateUserRequest;
import com.bcube.userservice.service.dto.response.ApiResponse;
import com.bcube.userservice.service.dto.response.UserResponse;
import com.bcube.userservice.service.impl.UserServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class UserController {
    @Autowired
    private final UserServiceImpl userService;

    @GetMapping("/admin/users")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> getAllUsers(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        Page<UserResponse> response = userService.getAllUsers(page, size);
        return ResponseEntity.ok(new ApiResponse<>("Users erfolgreich gesendet", response));
    }

    @PostMapping("/admin/users")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@Valid @RequestBody CreateUserRequest createUserRequest) {
        UserResponse response = userService.createUser(createUserRequest);
        return ResponseEntity.ok(new ApiResponse<>("User erfolgreich erstellt", response));
    }

    @DeleteMapping("/admin/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(new ApiResponse<>("User erfolgreich gelöscht", null));
    }

    @PutMapping("/admin/users/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(@PathVariable long id, @Valid @RequestBody UpdateUserRequest updateUserRequest) {
        UserResponse response = userService.updateUser(id, updateUserRequest);
        return ResponseEntity.ok(new ApiResponse<>("User erfolgreich aktuallisiert", response));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable long id) {
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(new ApiResponse<>("User erfolgreich aktuallisiert", user));
    }
}