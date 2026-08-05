package com.bcube.bookingservice.persistance.repository;

import com.bcube.bookingservice.persistance.entity.BookingIpEvent;
import com.bcube.bookingservice.persistance.entity.IpEventType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;

@Repository
public interface BookingIpEventRepository extends JpaRepository<BookingIpEvent, Long> {
    long countByIpAddressAndEventTypeAndCreatedAtAfter(String ipAddress, IpEventType eventType, Instant after);
}
