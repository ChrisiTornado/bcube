package com.bcube.paymentservice.service;

import com.bcube.paymentservice.service.dto.request.CreatePaymentIntentRequest;
import com.bcube.paymentservice.service.dto.request.RefundRequest;
import com.bcube.paymentservice.service.dto.response.PaymentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PaymentService {
    PaymentResponse createPaymentIntent(CreatePaymentIntentRequest request);
    PaymentResponse getById(Long id);
    PaymentResponse getByBookingId(Long bookingId);
    Page<PaymentResponse> getByUserId(Long userId, Pageable pageable);
    PaymentResponse refund(Long bookingId, RefundRequest request);
    void confirmCardVerification(Long bookingId);
    void handleWebhookEvent(String payload, String sigHeader);
}
