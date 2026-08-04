package com.bcube.paymentservice.persistance.repository;

import com.bcube.paymentservice.persistance.entity.Voucher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Long> {
    Optional<Voucher> findByCodeIgnoreCase(String code);
    Page<Voucher> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
