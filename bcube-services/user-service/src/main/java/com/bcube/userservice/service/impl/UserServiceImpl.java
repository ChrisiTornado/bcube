package com.bcube.userservice.service.impl;

import com.bcube.userservice.client.BookingClient;
import com.bcube.userservice.exception.UserHasOpenBookingsException;
import com.bcube.userservice.exception.UserNotFoundException;
import com.bcube.userservice.persistance.entity.Role;
import com.bcube.userservice.persistance.entity.User;
import com.bcube.userservice.persistance.repository.UserRepository;
import com.bcube.userservice.service.UserService;
import com.bcube.userservice.service.dto.request.UpdateOwnUserRequest;
import com.bcube.userservice.service.dto.response.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final BookingClient bookingClient;

    @Override
    public UserResponse getUserById(long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User nicht gefunden: " + id));

        return new UserResponse(
                user.getId(),
                user.getRole() == Role.ADMIN,
                user.getEmail(),
                user.getPhone(),
                user.getFirstName(),
                user.getLastName()
        );
    }

    @Override
    public UserResponse updateUserById(String email, UpdateOwnUserRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User nicht gefunden:  " + email));

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        user.setEmail(request.getEmail());
        userRepository.save(user);
        return new UserResponse(
                user.getId(),
                false,
                user.getEmail(),
                user.getPhone(),
                user.getFirstName(),
                user.getLastName()
        );
    }

    @Override
    public void deleteOwnAccount(String email, String token) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User nicht gefunden: " + email));

        if (bookingClient.hasOpenBookings(user.getId(), token)) {
            throw new UserHasOpenBookingsException(
                    "Dein Account kann nicht gelöscht werden, da noch nicht alle Buchungen abgeschlossen sind. Bitte storniere zuerst alle aktiven Buchungen."
            );
        }

        userRepository.delete(user);
    }
}
