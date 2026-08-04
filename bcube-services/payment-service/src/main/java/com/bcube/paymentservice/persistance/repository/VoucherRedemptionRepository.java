package com.bcube.paymentservice.persistance.repository;

import com.bcube.paymentservice.persistance.entity.RedemptionStatus;
import com.bcube.paymentservice.persistance.entity.VoucherRedemption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherRedemptionRepository extends JpaRepository<VoucherRedemption, Long> {
    long countByVoucherIdAndStatus(Long voucherId, RedemptionStatus status);
    long countByVoucherIdAndUserIdAndStatus(Long voucherId, Long userId, RedemptionStatus status);
    boolean existsByVoucherIdAndPhoneHash(Long voucherId, String phoneHash);
    boolean existsByVoucherIdAndCardFingerprint(Long voucherId, String cardFingerprint);
    boolean existsByVoucherIdAndUserIdAndStatusIn(Long voucherId, Long userId, List<RedemptionStatus> statuses);
    Optional<VoucherRedemption> findFirstByPaymentIdOrderByIdDesc(Long paymentId);
    Optional<VoucherRedemption> findFirstByVoucherIdAndUserIdAndStatus(Long voucherId, Long userId, RedemptionStatus status);
    List<VoucherRedemption> findAllByUserIdAndStatus(Long userId, RedemptionStatus status);
}
