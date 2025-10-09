package com.bcube.bookingservice.persistance.repository;

import com.bcube.bookingservice.persistance.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    Optional<Booking> findById(Long id);

    List<Booking> findAllByUserId(Long userId);

    List<Booking> findAllByStudioId(Long studioId);

    boolean existsByUserId(Long userId);

    boolean existsByStudioId(Long studioId);
}