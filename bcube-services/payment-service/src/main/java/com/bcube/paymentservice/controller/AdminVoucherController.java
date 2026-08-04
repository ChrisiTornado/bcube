package com.bcube.paymentservice.controller;

import com.bcube.paymentservice.persistance.entity.Voucher;
import com.bcube.paymentservice.service.dto.request.CreateVoucherRequest;
import com.bcube.paymentservice.service.dto.response.ApiResponse;
import com.bcube.paymentservice.service.dto.response.VoucherResponse;
import com.bcube.paymentservice.service.voucher.VoucherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/payments/vouchers")
public class AdminVoucherController {
    private final VoucherService voucherService;

    @PostMapping
    public ResponseEntity<ApiResponse<VoucherResponse>> create(@Valid @RequestBody CreateVoucherRequest request) {
        Voucher voucher = voucherService.create(request);
        return ResponseEntity.ok(new ApiResponse<>("Gutschein erfolgreich erstellt", toResponse(voucher)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<VoucherResponse>>> list(Pageable pageable) {
        Page<VoucherResponse> vouchers = voucherService.list(pageable).map(this::toResponse);
        return ResponseEntity.ok(new ApiResponse<>("Gutscheine erfolgreich geladen", vouchers));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<VoucherResponse>> deactivate(@PathVariable Long id) {
        Voucher voucher = voucherService.deactivate(id);
        return ResponseEntity.ok(new ApiResponse<>("Gutschein deaktiviert", toResponse(voucher)));
    }

    private VoucherResponse toResponse(Voucher voucher) {
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
}
