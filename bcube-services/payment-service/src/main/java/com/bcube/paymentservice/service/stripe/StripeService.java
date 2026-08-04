package com.bcube.paymentservice.service.stripe;

import com.bcube.paymentservice.exception.InvalidWebhookSignatureException;
import com.bcube.paymentservice.exception.StripeOperationException;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.PaymentMethod;
import com.stripe.model.Refund;
import com.stripe.model.SetupIntent;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.RefundCreateParams;
import com.stripe.param.SetupIntentCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class StripeService {

    @Value("${stripe.webhook.secret}")
    private String webhookSecret;

    public PaymentIntent createPaymentIntent(long amountCents, String currency, Map<String, String> metadata) {
        try {
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountCents)
                    .setCurrency(currency.toLowerCase())
                    .putAllMetadata(metadata)
                    .setAutomaticPaymentMethods(
                            PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                    .setEnabled(true)
                                    .build()
                    )
                    .build();
            return PaymentIntent.create(params);
        } catch (StripeException e) {
            throw new StripeOperationException("Zahlung konnte nicht erstellt werden: " + e.getMessage(), e);
        }
    }

    public Refund createRefund(String paymentIntentId, long amountCents) {
        try {
            RefundCreateParams params = RefundCreateParams.builder()
                    .setPaymentIntent(paymentIntentId)
                    .setAmount(amountCents)
                    .build();
            return Refund.create(params);
        } catch (StripeException e) {
            throw new StripeOperationException("Rückerstattung fehlgeschlagen: " + e.getMessage(), e);
        }
    }

    /**
     * Verifies a card without charging it - used for requiresCardVerification vouchers
     * (welcome voucher) redeeming to a FREE booking, so the card's fingerprint can still be
     * checked for prior abuse of the same voucher.
     */
    public SetupIntent createSetupIntent(Map<String, String> metadata) {
        try {
            SetupIntentCreateParams params = SetupIntentCreateParams.builder()
                    .putAllMetadata(metadata)
                    .setAutomaticPaymentMethods(
                            SetupIntentCreateParams.AutomaticPaymentMethods.builder()
                                    .setEnabled(true)
                                    .build()
                    )
                    .build();
            return SetupIntent.create(params);
        } catch (StripeException e) {
            throw new StripeOperationException("Kartenprüfung konnte nicht erstellt werden: " + e.getMessage(), e);
        }
    }

    public String getSetupIntentCardFingerprint(String setupIntentId) {
        try {
            SetupIntent setupIntent = SetupIntent.retrieve(setupIntentId);
            PaymentMethod paymentMethod = PaymentMethod.retrieve(setupIntent.getPaymentMethod());
            return paymentMethod.getCard().getFingerprint();
        } catch (StripeException e) {
            throw new StripeOperationException("Kartenprüfung fehlgeschlagen: " + e.getMessage(), e);
        }
    }

    public Event constructWebhookEvent(String payload, String sigHeader) {
        try {
            return Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            throw new InvalidWebhookSignatureException("Ungültige Webhook-Signatur");
        }
    }
}
