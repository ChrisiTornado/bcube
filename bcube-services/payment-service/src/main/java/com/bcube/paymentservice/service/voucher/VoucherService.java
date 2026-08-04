package com.bcube.paymentservice.service.voucher;

import com.bcube.paymentservice.exception.VoucherNotFoundException;
import com.bcube.paymentservice.persistance.entity.RedemptionStatus;
import com.bcube.paymentservice.persistance.entity.Voucher;
import com.bcube.paymentservice.persistance.entity.VoucherRedemption;
import com.bcube.paymentservice.persistance.repository.VoucherRedemptionRepository;
import com.bcube.paymentservice.persistance.repository.VoucherRepository;
import com.bcube.paymentservice.service.dto.request.CreateVoucherRequest;
import com.bcube.paymentservice.utility.PhoneHashUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class VoucherService {

    private final VoucherRepository voucherRepository;
    private final VoucherRedemptionRepository voucherRedemptionRepository;

    @Value("${welcome-voucher.code}")
    private String welcomeVoucherCode;

    @Value("${welcome-voucher.validity-days}")
    private long welcomeVoucherValidityDays;

    public VoucherService(VoucherRepository voucherRepository, VoucherRedemptionRepository voucherRedemptionRepository) {
        this.voucherRepository = voucherRepository;
        this.voucherRedemptionRepository = voucherRedemptionRepository;
    }

    public record PreviewResult(Voucher voucher, int discountAmountCents) {}
    public record RedeemResult(Voucher voucher, VoucherRedemption redemption, int discountAmountCents) {}

    /**
     * Preview a discount without redeeming - actual redemption happens transactionally
     * inside payment-intent creation, so an abandoned checkout never burns a single-use code.
     */
    public PreviewResult preview(String code, Long userId, Integer hourlyRateCents, Integer baseAmountCents, BigDecimal durationHours) {
        Voucher voucher = findEligibleVoucher(code, userId);
        int discountAmountCents = computeDiscount(voucher, hourlyRateCents, baseAmountCents, durationHours);
        return new PreviewResult(voucher, discountAmountCents);
    }

    /**
     * Validates eligibility, computes the discount, and persists the redemption in the same
     * step - called from within PaymentServiceImpl's own transaction so this either commits
     * together with the Payment row or rolls back with it. If a GRANTED row already exists
     * for this voucher+user (welcome voucher), that row transitions to REDEEMED instead of a
     * second row being created - manual codes with no prior grant get a fresh REDEEMED row.
     */
    @Transactional
    public RedeemResult redeem(String code, Long userId, Long bookingId, Integer hourlyRateCents, Integer baseAmountCents, BigDecimal durationHours) {
        Voucher voucher = findEligibleVoucher(code, userId);
        int discountAmountCents = computeDiscount(voucher, hourlyRateCents, baseAmountCents, durationHours);

        Optional<VoucherRedemption> granted = voucherRedemptionRepository
                .findFirstByVoucherIdAndUserIdAndStatus(voucher.getId(), userId, RedemptionStatus.GRANTED);

        if (granted.isPresent() && granted.get().getExpiresAt() != null && Instant.now().isAfter(granted.get().getExpiresAt())) {
            throw new IllegalArgumentException("Gutschein ist abgelaufen");
        }

        VoucherRedemption redemption = granted.orElseGet(() -> VoucherRedemption.builder()
                .voucherId(voucher.getId())
                .userId(userId)
                .build());

        redemption.setBookingId(bookingId);
        redemption.setStatus(RedemptionStatus.REDEEMED);
        redemption.setRedeemedAt(Instant.now());
        VoucherRedemption saved = voucherRedemptionRepository.save(redemption);

        return new RedeemResult(voucher, saved, discountAmountCents);
    }

    /**
     * Idempotently grants the welcome voucher at registration. Never throws - a payment-service
     * outage or an abuse-guard rejection must never fail registration itself; the caller
     * (user-service) fires this without inspecting the outcome.
     */
    @Transactional
    public void grantWelcomeVoucher(Long userId, String phone) {
        Optional<Voucher> voucherOpt = voucherRepository.findByCodeIgnoreCase(welcomeVoucherCode);
        if (voucherOpt.isEmpty()) {
            return;
        }
        Voucher voucher = voucherOpt.get();

        boolean alreadyGrantedToThisUser = voucherRedemptionRepository.existsByVoucherIdAndUserIdAndStatusIn(
                voucher.getId(), userId, List.of(RedemptionStatus.GRANTED, RedemptionStatus.REDEEMED));
        if (alreadyGrantedToThisUser) {
            return;
        }

        // Abuse guard: block a second grant to the same real-world phone under a different account.
        String phoneHash = PhoneHashUtil.hash(phone);
        if (voucherRedemptionRepository.existsByVoucherIdAndPhoneHash(voucher.getId(), phoneHash)) {
            return;
        }

        VoucherRedemption redemption = VoucherRedemption.builder()
                .voucherId(voucher.getId())
                .userId(userId)
                .status(RedemptionStatus.GRANTED)
                .grantedAt(Instant.now())
                .expiresAt(Instant.now().plus(welcomeVoucherValidityDays, ChronoUnit.DAYS))
                .phoneHash(phoneHash)
                .build();
        voucherRedemptionRepository.save(redemption);
    }

    public List<Voucher> getAvailableVouchers(Long userId) {
        Instant now = Instant.now();
        return voucherRedemptionRepository.findAllByUserIdAndStatus(userId, RedemptionStatus.GRANTED).stream()
                .filter(r -> r.getExpiresAt() == null || r.getExpiresAt().isAfter(now))
                .map(r -> voucherRepository.findById(r.getVoucherId()).orElse(null))
                .filter(Objects::nonNull)
                .toList();
    }

    public Voucher create(CreateVoucherRequest request) {
        Voucher voucher = Voucher.builder()
                .code(request.getCode())
                .name(request.getName())
                .discountType(request.getDiscountType())
                .discountPercentage(request.getDiscountPercentage())
                .discountAmountCents(request.getDiscountAmountCents())
                .discountHours(request.getDiscountHours())
                .maxRedemptionsPerUser(request.getMaxRedemptionsPerUser())
                .maxRedemptionsTotal(request.getMaxRedemptionsTotal())
                .expiresAt(request.getExpiresAt())
                .requiresCardVerification(request.getRequiresCardVerification())
                .active(true)
                .build();
        return voucherRepository.save(voucher);
    }

    public Page<Voucher> list(Pageable pageable) {
        return voucherRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    public Voucher deactivate(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new VoucherNotFoundException("Gutschein nicht gefunden"));
        voucher.setActive(false);
        return voucherRepository.save(voucher);
    }

    private Voucher findEligibleVoucher(String code, Long userId) {
        Voucher voucher = voucherRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new IllegalArgumentException("Gutscheincode ungültig"));

        if (!voucher.isActive()) {
            throw new IllegalArgumentException("Gutschein ist nicht mehr gültig");
        }

        if (voucher.getExpiresAt() != null && Instant.now().isAfter(voucher.getExpiresAt())) {
            throw new IllegalArgumentException("Gutschein ist abgelaufen");
        }

        long userRedemptions = voucherRedemptionRepository.countByVoucherIdAndUserIdAndStatus(
                voucher.getId(), userId, RedemptionStatus.REDEEMED);
        if (userRedemptions >= voucher.getMaxRedemptionsPerUser()) {
            throw new IllegalArgumentException("Gutschein wurde bereits eingelöst");
        }

        if (voucher.getMaxRedemptionsTotal() != null) {
            long totalRedemptions = voucherRedemptionRepository.countByVoucherIdAndStatus(voucher.getId(), RedemptionStatus.REDEEMED);
            if (totalRedemptions >= voucher.getMaxRedemptionsTotal()) {
                throw new IllegalArgumentException("Gutschein ist bereits ausgeschöpft");
            }
        }

        return voucher;
    }

    private int computeDiscount(Voucher voucher, Integer hourlyRateCents, Integer baseAmountCents, BigDecimal durationHours) {
        int discountAmountCents = switch (voucher.getDiscountType()) {
            case PERCENTAGE -> BigDecimal.valueOf(baseAmountCents)
                    .multiply(BigDecimal.valueOf(voucher.getDiscountPercentage()))
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP)
                    .intValue();
            case FIXED_AMOUNT -> voucher.getDiscountAmountCents();
            case FREE_HOURS -> {
                BigDecimal effectiveFreeHours = voucher.getDiscountHours().min(durationHours);
                yield BigDecimal.valueOf(hourlyRateCents)
                        .multiply(effectiveFreeHours)
                        .setScale(0, RoundingMode.HALF_UP)
                        .intValue();
            }
        };

        return Math.min(discountAmountCents, baseAmountCents);
    }
}
