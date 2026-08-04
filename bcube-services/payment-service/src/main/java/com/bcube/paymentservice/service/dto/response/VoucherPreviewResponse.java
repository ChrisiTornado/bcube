package com.bcube.paymentservice.service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VoucherPreviewResponse {
    private String code;
    private Integer discountAmountCents;
    private Integer baseAmountCents;
    private Integer finalAmountCents;
}
