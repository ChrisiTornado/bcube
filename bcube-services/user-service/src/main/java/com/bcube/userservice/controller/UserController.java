package com.bcube.userservice.controller;
import com.bcube.userservice.service.UserService;
import com.bcube.userservice.service.dto.request.UpdateOwnUserRequest;
import com.bcube.userservice.service.dto.response.ApiResponse;
import com.bcube.userservice.service.dto.response.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable long id) {
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(new ApiResponse<>("User erfolgreich geladen", user));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(Authentication authentication, @Valid @RequestBody UpdateOwnUserRequest updateOwnUserRequest) {
        System.out.println("AUTH NAME: " + authentication.getName());
        System.out.println("AUTH CLASS: " + authentication.getClass().getName());
        String email = authentication.getName();

        UserResponse user = userService.updateUserById(email, updateOwnUserRequest);
        return ResponseEntity.ok(new ApiResponse<>("User erfolgreich geladen", user));
    }
}
