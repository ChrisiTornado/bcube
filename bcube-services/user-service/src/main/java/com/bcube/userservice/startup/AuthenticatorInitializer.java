package com.bcube.userservice.startup;

import com.bcube.userservice.persistance.entity.Role;
import com.bcube.userservice.persistance.entity.User;
import com.bcube.userservice.persistance.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Order(2)
public class AuthenticatorInitializer implements CommandLineRunner {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${authenticator.email}")
    private String defaultEmail;
    @Value("${authenticator.password}")
    private String defaultPassword;

    @Override
    public void run(String... args) throws Exception {
        if (!userRepository.existsByEmail(defaultEmail)) {
            User authenticator = new User();
            authenticator.setEmail(defaultEmail);
            authenticator.setPassword(passwordEncoder.encode(defaultPassword));
            authenticator.setFirstName("Authenticator");
            authenticator.setLastName("User");
            authenticator.setPhone("+430000000000");
            authenticator.setRole(Role.AUTHENTICATOR);
            userRepository.save(authenticator);
            System.out.println("Default authenticator user created.");
        }
    }
}
