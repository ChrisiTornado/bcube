package com.bcube.paymentservice.persistance.repository;

import com.bcube.paymentservice.persistance.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findFirstByBookingIdOrderByIdDesc(Long bookingId);
    Optional<Payment> findByStripePaymentIntentId(String stripePaymentIntentId);
    Page<Payment> findAllByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
