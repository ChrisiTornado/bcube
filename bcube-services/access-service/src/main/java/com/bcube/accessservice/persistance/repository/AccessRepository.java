package com.bcube.accessservice.persistance.repository;

import com.bcube.accessservice.persistance.entity.AccessPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccessRepository extends JpaRepository<AccessPermission, Long> {
    Optional<AccessPermission> findByBookingId(Long bookingId);
    void deleteByBookingId(Long bookingId);
}