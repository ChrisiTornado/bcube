package com.bcube.paymentservice.controller;

import com.bcube.paymentservice.persistance.entity.Voucher;
import com.bcube.paymentservice.service.PaymentService;
import com.bcube.paymentservice.service.dto.request.CreatePaymentIntentRequest;
import com.bcube.paymentservice.service.dto.request.RefundRequest;
import com.bcube.paymentservice.service.dto.request.ValidateVoucherRequest;
import com.bcube.paymentservice.service.dto.request.WelcomeGrantRequest;
import com.bcube.paymentservice.service.dto.response.ApiResponse;
import com.bcube.paymentservice.service.dto.response.PaymentResponse;
import com.bcube.paymentservice.service.dto.response.VoucherPreviewResponse;
import com.bcube.paymentservice.service.dto.response.VoucherResponse;
import com.bcube.paymentservice.service.voucher.VoucherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentService paymentService;
    private final VoucherService voucherService;

    @PostMapping("/intents")
    public ResponseEntity<ApiResponse<PaymentResponse>> createIntent(@Valid @RequestBody CreatePaymentIntentRequest request) {
        PaymentResponse response = paymentService.createPaymentIntent(request);
        return ResponseEntity.ok(new ApiResponse<>("Zahlung erfolgreich erstellt", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getById(@PathVariable Long id) {
        PaymentResponse response = paymentService.getById(id);
        return ResponseEntity.ok(new ApiResponse<>("Zahlung erfolgreich geladen", response));
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getByBooking(@PathVariable Long bookingId) {
        PaymentResponse response = paymentService.getByBookingId(bookingId);
        return ResponseEntity.ok(new ApiResponse<>("Zahlung erfolgreich geladen", response));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<Page<PaymentResponse>>> getByUser(@PathVariable Long userId, Pageable pageable) {
        Page<PaymentResponse> response = paymentService.getByUserId(userId, pageable);
        return ResponseEntity.ok(new ApiResponse<>("Zahlungen erfolgreich geladen", response));
    }

    @PostMapping("/{bookingId}/refund")
    public ResponseEntity<ApiResponse<PaymentResponse>> refund(@PathVariable Long bookingId, @Valid @RequestBody RefundRequest request) {
        PaymentResponse response = paymentService.refund(bookingId, request);
        return ResponseEntity.ok(new ApiResponse<>("Rückerstattung erfolgreich verarbeitet", response));
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(@RequestBody String payload,
                                         @RequestHeader("Stripe-Signature") String sigHeader) {
        paymentService.handleWebhookEvent(payload, sigHeader);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{bookingId}/confirm-card-verification")
    public ResponseEntity<ApiResponse<Void>> confirmCardVerification(@PathVariable Long bookingId) {
        paymentService.confirmCardVerification(bookingId);
        return ResponseEntity.ok(new ApiResponse<>("Kartenprüfung abgeschlossen", null));
    }

    @PostMapping("/vouchers/welcome-grant")
    public ResponseEntity<ApiResponse<Void>> welcomeGrant(@Valid @RequestBody WelcomeGrantRequest request) {
        voucherService.grantWelcomeVoucher(request.getUserId(), request.getPhone());
        return ResponseEntity.ok(new ApiResponse<>("Willkommensgutschein verarbeitet", null));
    }

    @GetMapping("/vouchers/my-available")
    public ResponseEntity<ApiResponse<List<VoucherResponse>>> myAvailableVouchers(@RequestParam Long userId) {
        List<VoucherResponse> vouchers = voucherService.getAvailableVouchers(userId).stream()
                .map(this::toVoucherResponse)
                .toList();
        return ResponseEntity.ok(new ApiResponse<>("Verfügbare Gutscheine geladen", vouchers));
    }

    private VoucherResponse toVoucherResponse(Voucher voucher) {
        return new VoucherResponse(
                voucher.getId(),
                voucher.getCode(),
                voucher.getName(),
                voucher.getDiscountType(),
                voucher.getDiscountPercentage(),
                voucher.getDiscountAmountCents(),
                voucher.getDiscountHours(),
                voucher.getMaxRedemptionsPerUser(),
                voucher.getMaxRedemptionsTotal(),
                voucher.getExpiresAt(),
                voucher.isActive(),
                voucher.isRequiresCardVerification(),
                voucher.getCreatedAt()
        );
    }

    @PostMapping("/vouchers/validate")
    public ResponseEntity<ApiResponse<VoucherPreviewResponse>> validateVoucher(@Valid @RequestBody ValidateVoucherRequest request) {
        int baseAmountCents = BigDecimal.valueOf(request.getHourlyRateCents())
                .multiply(request.getDurationHours())
                .setScale(0, RoundingMode.HALF_UP)
                .intValueExact();

        VoucherService.PreviewResult result = voucherService.preview(
                request.getCode(), request.getUserId(), request.getHourlyRateCents(), baseAmountCents, request.getDurationHours()
        );

        VoucherPreviewResponse response = new VoucherPreviewResponse(
                result.voucher().getCode(),
                result.discountAmountCents(),
                baseAmountCents,
                baseAmountCents - result.discountAmountCents()
        );
        return ResponseEntity.ok(new ApiResponse<>("Gutschein gültig", response));
    }
}
