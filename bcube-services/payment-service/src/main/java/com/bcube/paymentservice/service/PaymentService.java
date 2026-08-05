package com.bcube.paymentservice.service;

import com.bcube.paymentservice.security.RequestingUser;
import com.bcube.paymentservice.service.dto.request.CreatePaymentIntentRequest;
import com.bcube.paymentservice.service.dto.request.RefundRequest;
import com.bcube.paymentservice.service.dto.response.PaymentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PaymentService {
    PaymentResponse createPaymentIntent(CreatePaymentIntentRequest request);
    PaymentResponse getById(Long id, RequestingUser requester);
    PaymentResponse getByBookingId(Long bookingId, RequestingUser requester);
    Page<PaymentResponse> getByUserId(Long userId, Pageable pageable, RequestingUser requester);
    PaymentResponse refund(Long bookingId, RefundRequest request, RequestingUser requester);
    void confirmCardVerification(Long bookingId, RequestingUser requester);
    void handleWebhookEvent(String payload, String sigHeader);
}
