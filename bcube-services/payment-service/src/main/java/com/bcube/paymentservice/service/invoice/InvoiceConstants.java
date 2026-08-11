package com.bcube.paymentservice.service.invoice;

import java.math.BigDecimal;

/**
 * Fixed platform-operator ("seller") details shown on every invoice, and the VAT rate applied to
 * all bookings. Neither Studio nor User currently carries a registered company name/address/UID,
 * so invoices are issued by the platform itself rather than per-studio. Placeholder values -
 * replace with the real registered company details (and a proper config source) before this goes
 * live.
 */
public final class InvoiceConstants {
    private InvoiceConstants() {
    }

    public static final String SELLER_NAME = "CUBE Bookings GmbH";
    public static final String SELLER_STREET = "Musterstraße 12";
    public static final String SELLER_ZIP_CITY = "1010 Wien";
    public static final String SELLER_COUNTRY = "Österreich";
    public static final String SELLER_UID = "ATU12345678";
    public static final String SELLER_EMAIL = "office@cube-bookings.at";
    public static final String SELLER_PHONE = "+43 1 234 5678";

    /** Austrian standard VAT rate (Normalsteuersatz) - Cube/room rental is not a reduced-rate service. */
    public static final BigDecimal VAT_RATE = new BigDecimal("0.20");
}
