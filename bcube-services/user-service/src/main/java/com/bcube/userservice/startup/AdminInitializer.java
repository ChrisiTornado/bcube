package com.bcube.userservice.startup;

import com.bcube.userservice.persistance.entity.Role;
import com.bcube.userservice.persistance.entity.User;
import com.bcube.userservice.persistance.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Seeds a single ADMIN account on first boot, driven entirely by env vars with no hardcoded
 * fallback - deploying without ADMIN_BOOTSTRAP_EMAIL/ADMIN_BOOTSTRAP_PASSWORD set simply skips
 * seeding (logged, not silently ignored) rather than falling back to a guessable default.
 */
@Slf4j
@Component
public class AdminInitializer implements CommandLineRunner {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${admin.email:}")
    private String defaultEmail;
    @Value("${admin.password:}")
    private String defaultPassword;

    @Override
    public void run(String... args) throws Exception {
        if (!StringUtils.hasText(defaultEmail) || !StringUtils.hasText(defaultPassword)) {
            log.warn("ADMIN_BOOTSTRAP_EMAIL/ADMIN_BOOTSTRAP_PASSWORD nicht gesetzt - es wird kein Admin-Account geseedet.");
            return;
        }

        if (!userRepository.existsByEmail(defaultEmail)) {
            User admin = new User();
            admin.setEmail(defaultEmail);
            admin.setPassword(passwordEncoder.encode(defaultPassword));
            admin.setFirstName("Admin");
            admin.setLastName("User");
            admin.setPhone("+4369919547566");
            admin.setRole(Role.ADMIN);
            userRepository.save(admin);
            log.info("Default-Admin-Account für {} angelegt.", defaultEmail);
        }
    }
}
