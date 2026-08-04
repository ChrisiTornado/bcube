package com.bcube.paymentservice.startup;

import com.bcube.paymentservice.persistance.entity.DiscountType;
import com.bcube.paymentservice.persistance.entity.Voucher;
import com.bcube.paymentservice.persistance.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class WelcomeVoucherInitializer implements CommandLineRunner {

    private final VoucherRepository voucherRepository;

    @Value("${welcome-voucher.code}")
    private String code;

    @Value("${welcome-voucher.free-hours}")
    private BigDecimal freeHours;

    @Override
    public void run(String... args) {
        if (voucherRepository.findByCodeIgnoreCase(code).isPresent()) {
            return;
        }

        Voucher voucher = Voucher.builder()
                .code(code)
                .name("Willkommensgutschein")
                .discountType(DiscountType.FREE_HOURS)
                .discountHours(freeHours)
                .maxRedemptionsPerUser(1)
                .requiresCardVerification(true)
                .active(true)
                .build();
        voucherRepository.save(voucher);
    }
}
