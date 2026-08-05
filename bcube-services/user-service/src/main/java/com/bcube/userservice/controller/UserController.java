package com.bcube.userservice.controller;
import com.bcube.userservice.service.UserService;
import com.bcube.userservice.service.dto.request.UpdateOwnUserRequest;
import com.bcube.userservice.service.dto.response.ApiResponse;
import com.bcube.userservice.service.dto.response.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable long id, Authentication authentication) {
        UserResponse user = userService.getUserById(id);

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
        boolean isOwnProfile = user.getEmail().equals(authentication.getName());
        if (!isAdmin && !isOwnProfile) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Kein Zugriff auf dieses Profil");
        }

        return ResponseEntity.ok(new ApiResponse<>("User erfolgreich geladen", user));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(Authentication authentication, @Valid @RequestBody UpdateOwnUserRequest updateOwnUserRequest) {
        String email = authentication.getName();

        UserResponse user = userService.updateUserById(email, updateOwnUserRequest);
        return ResponseEntity.ok(new ApiResponse<>("User erfolgreich aktualisiert", user));
    }

    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<Void>> deleteOwnAccount(
            Authentication authentication,
            @RequestHeader("Authorization") String authorizationHeader
    ) {
        userService.deleteOwnAccount(authentication.getName(), authorizationHeader.replace("Bearer ", ""));
        return ResponseEntity.ok(new ApiResponse<>("Account erfolgreich gelöscht", null));
    }
}
