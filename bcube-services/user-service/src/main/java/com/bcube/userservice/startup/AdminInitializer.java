package com.bcube.userservice.startup;

import com.bcube.userservice.persistance.entity.Role;
import com.bcube.userservice.persistance.entity.User;
import com.bcube.userservice.persistance.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminInitializer implements CommandLineRunner {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${admin.email}")
    private String defaultEmail;
    @Value("${admin.password}")
    private String defaultPassword;

    @Override
    public void run(String... args) throws Exception {
        if (!userRepository.existsByEmail(defaultEmail)) {
            User admin = new User();
            admin.setEmail(defaultEmail);
            admin.setPassword(passwordEncoder.encode(defaultPassword));
            admin.setFirstName("Admin");
            admin.setLastName("User");
            admin.setPhone("+4369919547566");
            admin.setRole(Role.ADMIN);
            userRepository.save(admin);
            System.out.println("Default admin user created.");
        }
    }
}