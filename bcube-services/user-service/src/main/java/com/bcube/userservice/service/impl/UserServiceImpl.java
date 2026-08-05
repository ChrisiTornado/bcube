package com.bcube.userservice.service.impl;

import com.bcube.userservice.client.BookingClient;
import com.bcube.userservice.exception.UserHasOpenBookingsException;
import com.bcube.userservice.exception.UserNotFoundException;
import com.bcube.userservice.persistance.entity.AuthProvider;
import com.bcube.userservice.persistance.entity.Role;
import com.bcube.userservice.persistance.entity.User;
import com.bcube.userservice.persistance.repository.UserRepository;
import com.bcube.userservice.service.UserService;
import com.bcube.userservice.service.dto.request.UpdateOwnUserRequest;
import com.bcube.userservice.service.dto.response.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final BookingClient bookingClient;
    private final MailService mailService;

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
                user.getLastName(),
                user.getAuthProvider()
        );
    }

    @Override
    public UserResponse updateUserById(String email, UpdateOwnUserRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User nicht gefunden:  " + email));

        // Google-supplied fields (name, email) aren't user-editable once Google has actually
        // provided them - only ever accept a change here for whichever of them is still blank
        // (i.e. genuinely missing, being filled in for the first time via the complete-profile
        // flow). Phone always comes from the user directly, regardless of auth provider.
        if (user.getAuthProvider() == AuthProvider.GOOGLE) {
            if (!StringUtils.hasText(user.getFirstName())) {
                user.setFirstName(request.getFirstName());
            }
            if (!StringUtils.hasText(user.getLastName())) {
                user.setLastName(request.getLastName());
            }
        } else {
            user.setFirstName(request.getFirstName());
            user.setLastName(request.getLastName());
            user.setEmail(request.getEmail());
        }
        user.setPhone(request.getPhone());
        userRepository.save(user);
        return new UserResponse(
                user.getId(),
                user.getRole() == Role.ADMIN,
                user.getEmail(),
                user.getPhone(),
                user.getFirstName(),
                user.getLastName(),
                user.getAuthProvider()
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
        mailService.sendAccountDeletedEmail(user.getEmail(), user.getFirstName());
    }
}
