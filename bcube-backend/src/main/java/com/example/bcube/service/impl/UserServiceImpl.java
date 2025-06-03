package com.example.bcube.service.impl;

import com.example.bcube.persistence.entity.Role;
import com.example.bcube.persistence.entity.User;
import com.example.bcube.persistence.repository.UserRepository;
import com.example.bcube.service.UserService;
import com.example.bcube.service.dto.CreateUserRequest;
import com.example.bcube.service.dto.StudioResponse;
import com.example.bcube.service.dto.UpdateUserRequest;
import com.example.bcube.service.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;

    @Override
    public UserResponse[] getAllUsers() {
        List<User> userList = userRepository.findAll();
        return userList.stream()
                .map(user -> new UserResponse(
                        user.getId(),
                        user.getRole() == Role.ADMIN,
                        user.getEmail(),
                        user.getPhone(),
                        user.getFirstName(),
                        user.getLastName()
                ))
                .toArray(UserResponse[]::new);
    }

    @Override
    public UserResponse createUser(CreateUserRequest createUserRequest) {
        if (userRepository.existsByEmail(createUserRequest.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-Mail bereits vergeben.");
        }

        User user = User.builder()
                .email(createUserRequest.getEmail())
                .password("default-password") // TODO: Generiere sicheres Passwort oder Registrierung mit Passwort
                .firstName(createUserRequest.getFirstName())
                .lastName(createUserRequest.getLastName())
                .phone(createUserRequest.getPhone())
                .role(createUserRequest.isAdmin() ? Role.ADMIN : Role.USER)
                .build();

        User saved = userRepository.save(user);

        return new UserResponse(
                saved.getId(),
                saved.getRole() == Role.ADMIN,
                saved.getEmail(),
                saved.getPhone(),
                saved.getFirstName(),
                saved.getLastName()
        );
    }

    @Override
    public void deleteUser(long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User nicht gefunden"));
        userRepository.delete(user);
    }

    @Override
    public UserResponse updateUser(long id, UpdateUserRequest updateUserRequest) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User nicht gefunden"));

        user.setFirstName(updateUserRequest.getFirstName());
        user.setLastName(updateUserRequest.getLastName());
        user.setEmail(updateUserRequest.getEmail());
        user.setPhone(updateUserRequest.getPhone());
        user.setRole(updateUserRequest.isAdmin() ? Role.ADMIN : Role.USER);

        User updated = userRepository.save(user);

        return new UserResponse(
                updated.getId(),
                updated.getRole() == Role.ADMIN,
                updated.getEmail(),
                updated.getPhone(),
                updated.getFirstName(),
                updated.getLastName()
        );
    }
}
