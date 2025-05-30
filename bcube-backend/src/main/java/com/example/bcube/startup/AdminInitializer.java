package com.example.bcube.startup;

import com.example.bcube.persistence.entity.Role;
import com.example.bcube.persistence.entity.User;
import com.example.bcube.persistence.repository.UserRepository;
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