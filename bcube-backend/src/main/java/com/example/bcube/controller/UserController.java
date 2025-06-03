package com.example.bcube.controller;

import com.example.bcube.service.dto.*;
import com.example.bcube.service.impl.UserServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin")
public class UserController {
    @Autowired
    private UserServiceImpl userService;

    @GetMapping("/get-all-users")
    public ResponseEntity<ApiResponse<UserResponse[]>> getAllUsers()   {
        UserResponse[] response = userService.getAllUsers();
        return ResponseEntity.ok(new ApiResponse<>("Users erfolgreich gesendet", response));
    }

    @PostMapping("/create-user")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@Valid @RequestBody CreateUserRequest createUserRequest) {
        UserResponse response = userService.createUser(createUserRequest);
        return ResponseEntity.ok(new ApiResponse<>("User erfolgreich erstellt", response));
    }

    @DeleteMapping("/delete-user/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(new ApiResponse<>("User erfolgreich gelöscht", null));
    }

    @PutMapping("/update-user/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(@PathVariable long id, @Valid @RequestBody UpdateUserRequest updateUserRequest) {
        UserResponse response = userService.updateUser(id, updateUserRequest);
        return ResponseEntity.ok(new ApiResponse<>("User erfolgreich aktuallisiert", response));
    }
}
