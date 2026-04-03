package com.bcube.userservice.service.impl;

import com.bcube.userservice.persistance.entity.Role;
import com.bcube.userservice.persistance.entity.User;
import com.bcube.userservice.persistance.repository.UserRepository;
import com.bcube.userservice.service.AdminService;
import com.bcube.userservice.service.dto.request.CreateUserRequest;
import com.bcube.userservice.service.dto.request.AdminUpdateUserRequest;
import com.bcube.userservice.service.dto.response.UserNameResponse;
import com.bcube.userservice.service.dto.response.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {
    private final UserRepository userRepository;

    @Override
    public Page<UserResponse> getAllUsers(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<User> userList = userRepository.findAll(pageable);
        return userList
                .map(user -> new UserResponse(
                        user.getId(),
                        user.getRole() == Role.ADMIN,
                        user.getEmail(),
                        user.getPhone(),
                        user.getFirstName(),
                        user.getLastName()
                ));
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
    public UserResponse updateUser(long id, AdminUpdateUserRequest adminUpdateUserRequest) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User nicht gefunden"));

        user.setFirstName(adminUpdateUserRequest.getFirstName());
        user.setLastName(adminUpdateUserRequest.getLastName());
        user.setEmail(adminUpdateUserRequest.getEmail());
        user.setPhone(adminUpdateUserRequest.getPhone());
        user.setRole(adminUpdateUserRequest.isAdmin() ? Role.ADMIN : Role.USER);

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

    @Override
    public Page<UserNameResponse> getUserNamesOfBookings(int page, int size) {
        Sort sort = Sort.by(
                Sort.Order.asc("lastName"),
                Sort.Order.asc("firstName")
        );
        Pageable pageable = PageRequest.of(page, size, sort);
        return userRepository.findUserNames(pageable);
    }
}