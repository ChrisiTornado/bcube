package com.bcube.bookingservice.persistance.repository;

import com.bcube.bookingservice.persistance.entity.Booking;
import com.bcube.bookingservice.persistance.entity.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    Optional<Booking> findById(Long id);

    List<Booking> findAllByStudioIdAndDate(Long studioId, LocalDate date);

    Page<Booking> findAllByUserId(Long userId, Pageable pageable);

    List<Booking> findAllByStudioId(Long studioId);

    Page<Booking> findAllByStudioId(Long studioId, Pageable pageable);

    Page<Booking> findAllByUserIdAndStudioId(
            Long userId,
            Long studioId,
            Pageable pageable
    );

    List<Booking> findAllByStatusInAndDateLessThanEqual(
            Collection<BookingStatus> statuses,
            LocalDate date
    );
}
