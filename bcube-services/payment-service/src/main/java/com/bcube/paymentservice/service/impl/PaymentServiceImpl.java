package com.bcube.paymentservice.service.impl;

import com.bcube.paymentservice.client.BookingClient;
import com.bcube.paymentservice.exception.PaymentNotFoundException;
import com.bcube.paymentservice.persistance.entity.Payment;
import com.bcube.paymentservice.persistance.entity.PaymentStatus;
import com.bcube.paymentservice.persistance.entity.Voucher;
import com.bcube.paymentservice.persistance.repository.PaymentRepository;
import com.bcube.paymentservice.persistance.repository.VoucherRedemptionRepository;
import com.bcube.paymentservice.service.PaymentService;
import com.bcube.paymentservice.service.dto.request.CreatePaymentIntentRequest;
import com.bcube.paymentservice.service.dto.request.RefundRequest;
import com.bcube.paymentservice.service.dto.response.PaymentResponse;
import com.bcube.paymentservice.service.stripe.StripeService;
import com.bcube.paymentservice.service.voucher.VoucherService;
import com.bcube.paymentservice.persistance.entity.RedemptionStatus;
import com.bcube.paymentservice.persistance.entity.VoucherRedemption;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.model.SetupIntent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final StripeService stripeService;
    private final BookingClient bookingClient;
    private final VoucherService voucherService;
    private final VoucherRedemptionRepository voucherRedemptionRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public PaymentResponse createPaymentIntent(CreatePaymentIntentRequest request) {
        int baseAmountCents = BigDecimal.valueOf(request.getHourlyRateCents())
                .multiply(request.getDurationHours())
                .setScale(0, RoundingMode.HALF_UP)
                .intValueExact();

        int discountAmountCents = 0;
        Voucher voucher = null;
        VoucherService.RedeemResult redemption = null;

        if (request.getVoucherCode() != null && !request.getVoucherCode().isBlank()) {
            redemption = voucherService.redeem(
                    request.getVoucherCode(), request.getUserId(), request.getBookingId(),
                    request.getHourlyRateCents(), baseAmountCents, request.getDurationHours()
            );
            voucher = redemption.voucher();
            discountAmountCents = redemption.discountAmountCents();
        }

        int finalAmountCents = baseAmountCents - discountAmountCents;

        Payment payment = Payment.builder()
                .bookingId(request.getBookingId())
                .userId(request.getUserId())
                .studioId(request.getStudioId())
                .hourlyRateCentsSnapshot(request.getHourlyRateCents())
                .durationHours(request.getDurationHours())
                .baseAmountCents(baseAmountCents)
                .discountAmountCents(discountAmountCents)
                .finalAmountCents(finalAmountCents)
                .currency(request.getCurrency())
                .studioName(request.getStudioName())
                .bookingDate(request.getBookingDate())
                .voucherId(voucher != null ? voucher.getId() : null)
                .build();

        String clientSecret = null;

        if (finalAmountCents > 0) {
            PaymentIntent intent = stripeService.createPaymentIntent(
                    finalAmountCents,
                    request.getCurrency(),
                    Map.of(
                            "bookingId", String.valueOf(request.getBookingId()),
                            "userId", String.valueOf(request.getUserId())
                    )
            );
            payment.setStatus(PaymentStatus.REQUIRES_PAYMENT);
            payment.setStripePaymentIntentId(intent.getId());
            clientSecret = intent.getClientSecret();
        } else if (voucher != null && voucher.isRequiresCardVerification()) {
            // FREE = zero charge, not zero Stripe contact: a requiresCardVerification voucher
            // (welcome voucher) still needs its card fingerprinted before access is granted.
            SetupIntent setupIntent = stripeService.createSetupIntent(
                    Map.of(
                            "bookingId", String.valueOf(request.getBookingId()),
                            "userId", String.valueOf(request.getUserId())
                    )
            );
            payment.setStatus(PaymentStatus.REQUIRES_CARD_VERIFICATION);
            payment.setStripeSetupIntentId(setupIntent.getId());
            clientSecret = setupIntent.getClientSecret();
        } else {
            payment.setStatus(PaymentStatus.FREE);
        }

        Payment saved = paymentRepository.save(payment);

        if (redemption != null) {
            redemption.redemption().setPaymentId(saved.getId());
            voucherRedemptionRepository.save(redemption.redemption());
        }

        return toResponse(saved, clientSecret);
    }

    @Override
    public PaymentResponse getById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new PaymentNotFoundException("Zahlung nicht gefunden"));
        return toResponse(payment, null);
    }

    @Override
    public PaymentResponse getByBookingId(Long bookingId) {
        Payment payment = paymentRepository.findFirstByBookingIdOrderByIdDesc(bookingId)
                .orElseThrow(() -> new PaymentNotFoundException("Zahlung nicht gefunden"));
        return toResponse(payment, null);
    }

    @Override
    public Page<PaymentResponse> getByUserId(Long userId, Pageable pageable) {
        return paymentRepository.findAllByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(payment -> toResponse(payment, null));
    }

    @Override
    @Transactional
    public PaymentResponse refund(Long bookingId, RefundRequest request) {
        Payment payment = paymentRepository.findFirstByBookingIdOrderByIdDesc(bookingId)
                .orElseThrow(() -> new PaymentNotFoundException("Zahlung nicht gefunden"));

        if (payment.getStatus() == PaymentStatus.FREE) {
            return toResponse(payment, null);
        }

        int refundAmountCents = BigDecimal.valueOf(payment.getFinalAmountCents())
                .multiply(BigDecimal.valueOf(request.getRefundPercentage()))
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP)
                .intValueExact();

        Refund refund = stripeService.createRefund(payment.getStripePaymentIntentId(), refundAmountCents);

        payment.setStripeRefundId(refund.getId());
        payment.setRefundedAmountCents(refundAmountCents);
        payment.setStatus(refundAmountCents >= payment.getFinalAmountCents()
                ? PaymentStatus.REFUNDED
                : PaymentStatus.PARTIALLY_REFUNDED);

        Payment saved = paymentRepository.save(payment);
        return toResponse(saved, null);
    }

    @Override
    @Transactional
    public void confirmCardVerification(Long bookingId) {
        Payment payment = paymentRepository.findFirstByBookingIdOrderByIdDesc(bookingId)
                .orElseThrow(() -> new PaymentNotFoundException("Zahlung nicht gefunden"));

        if (payment.getStatus() != PaymentStatus.REQUIRES_CARD_VERIFICATION) {
            // Already finalized (duplicate confirm call) - avoid double-processing.
            return;
        }

        String fingerprint = stripeService.getSetupIntentCardFingerprint(payment.getStripeSetupIntentId());

        VoucherRedemption redemption = voucherRedemptionRepository.findFirstByPaymentIdOrderByIdDesc(payment.getId())
                .orElseThrow(() -> new IllegalStateException("Gutschein-Einlösung nicht gefunden"));

        boolean cardAlreadyUsedForThisVoucher = voucherRedemptionRepository
                .existsByVoucherIdAndCardFingerprint(redemption.getVoucherId(), fingerprint);

        if (cardAlreadyUsedForThisVoucher) {
            // Free the redemption slot back up - the abuser's own failed attempt shouldn't
            // permanently consume their one-per-user allowance.
            voucherRedemptionRepository.delete(redemption);
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            bookingClient.updatePaymentStatus(bookingId, "FAILED");
            throw new IllegalArgumentException("Diese Karte wurde für diesen Gutschein bereits verwendet");
        }

        redemption.setCardFingerprint(fingerprint);
        redemption.setStatus(RedemptionStatus.REDEEMED);
        voucherRedemptionRepository.save(redemption);

        payment.setStatus(PaymentStatus.FREE);
        paymentRepository.save(payment);

        bookingClient.updatePaymentStatus(bookingId, "SUCCEEDED");
    }

    @Override
    @Transactional
    public void handleWebhookEvent(String payload, String sigHeader) {
        Event event = stripeService.constructWebhookEvent(payload, sigHeader);

        switch (event.getType()) {
            case "payment_intent.succeeded" -> handlePaymentIntentOutcome(payload, PaymentStatus.SUCCEEDED, "SUCCEEDED");
            case "payment_intent.payment_failed" -> handlePaymentIntentOutcome(payload, PaymentStatus.FAILED, "FAILED");
            default -> log.debug("Ignoring unhandled Stripe event type: {}", event.getType());
        }
    }

    private void handlePaymentIntentOutcome(String payload, PaymentStatus newStatus, String bookingCallbackStatus) {
        String paymentIntentId = extractPaymentIntentId(payload);

        Payment payment = paymentRepository.findByStripePaymentIntentId(paymentIntentId)
                .orElseThrow(() -> new PaymentNotFoundException("Zahlung für PaymentIntent " + paymentIntentId + " nicht gefunden"));

        if (payment.getStatus() == PaymentStatus.SUCCEEDED || payment.getStatus() == PaymentStatus.FAILED) {
            // Already finalized (Stripe may redeliver the same event) - avoid double-processing.
            return;
        }

        payment.setStatus(newStatus);
        paymentRepository.save(payment);

        bookingClient.updatePaymentStatus(payment.getBookingId(), bookingCallbackStatus);
    }

    /**
     * Reads the PaymentIntent id directly from the raw webhook JSON instead of Stripe SDK's
     * typed deserializer (event.getDataObjectDeserializer()), which can silently return empty
     * when the account's API version is newer than what the pinned stripe-java version's object
     * models expect - a documented SDK limitation, not a bug on our side. We only ever need the
     * id here to look up our own Payment row, so this sidesteps the version-skew failure mode.
     */
    private String extractPaymentIntentId(String payload) {
        try {
            return objectMapper.readTree(payload).path("data").path("object").path("id").asText();
        } catch (Exception e) {
            throw new IllegalArgumentException("Konnte Stripe-Ereignisdaten nicht lesen", e);
        }
    }

    private PaymentResponse toResponse(Payment payment, String clientSecret) {
        return new PaymentResponse(
                payment.getId(),
                payment.getBookingId(),
                payment.getUserId(),
                payment.getStudioId(),
                payment.getHourlyRateCentsSnapshot(),
                payment.getDurationHours(),
                payment.getBaseAmountCents(),
                payment.getDiscountAmountCents(),
                payment.getFinalAmountCents(),
                payment.getCurrency(),
                payment.getStatus(),
                clientSecret,
                payment.getRefundedAmountCents(),
                payment.getStudioName(),
                payment.getBookingDate(),
                payment.getCreatedAt()
        );
    }
}
