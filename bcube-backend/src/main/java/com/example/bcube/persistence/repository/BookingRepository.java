package com.example.bcube.persistence.repository;

import com.example.bcube.persistence.entity.Booking;
import com.example.bcube.persistence.entity.Studio;
import com.example.bcube.persistence.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    Optional<Booking> findById(Long id);

    List<Booking> findAllByUser(User user);
}
