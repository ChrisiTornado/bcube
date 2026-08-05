package com.bcube.bookingservice.persistance.repository;

import com.bcube.bookingservice.persistance.entity.IpBan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IpBanRepository extends JpaRepository<IpBan, Long> {
    Optional<IpBan> findByIpAddress(String ipAddress);
}
