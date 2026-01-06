package com.bcube.userservice.persistance.repository;

import com.bcube.userservice.persistance.entity.User;
import com.bcube.userservice.service.dto.response.UserNameResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    User findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findById(Long id);

    @Query("""
        select new com.bcube.userservice.service.dto.response.UserNameResponse(
            u.id,
            u.firstName,
            u.lastName
        )
        from User u
    """)
    Page<UserNameResponse> findUserNames(Pageable pageable);
}