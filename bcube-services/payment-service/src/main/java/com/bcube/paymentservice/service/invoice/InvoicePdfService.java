package com.bcube.paymentservice.service.invoice;

import com.bcube.paymentservice.client.UserDto;
import com.bcube.paymentservice.persistance.entity.Payment;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Renders a Payment as an Austrian-compliant invoice PDF (§ 11 UStG): seller name/address/UID,
 * buyer name, sequential invoice number, issue + service date, description/quantity, net amount,
 * VAT rate/amount and gross total are all present. See InvoiceConstants for the (placeholder)
 * seller identity.
 */
@Service
public class InvoicePdfService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final Color BRAND_ORANGE = new Color(0xff, 0xa7, 0x22);

    private final Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, new Color(0x11, 0x11, 0x11));
    private final Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
    private final Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
    private final Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
    private final Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.GRAY);
    private final Font tableHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.BLACK);

    public byte[] generate(Payment payment, UserDto buyer) {
        Document document = new Document(PageSize.A4, 50, 50, 50, 50);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            document.add(sellerBlock());
            document.add(Chunk.NEWLINE);
            document.add(recipientBlock(buyer));
            document.add(Chunk.NEWLINE);
            document.add(Chunk.NEWLINE);

            Paragraph title = new Paragraph("RECHNUNG", titleFont);
            title.setSpacingAfter(12);
            document.add(title);

            document.add(metaTable(payment, buyer));
            document.add(Chunk.NEWLINE);

            Amounts amounts = Amounts.from(payment);
            document.add(itemsTable(payment, amounts));
            document.add(Chunk.NEWLINE);

            document.add(summaryTable(amounts));
            document.add(Chunk.NEWLINE);
            document.add(Chunk.NEWLINE);

            document.add(footerBlock());
            document.close();
        } catch (DocumentException e) {
            throw new RuntimeException("Rechnung konnte nicht erstellt werden", e);
        }

        return out.toByteArray();
    }

    private Paragraph sellerBlock() {
        Paragraph p = new Paragraph();
        p.add(new Chunk(InvoiceConstants.SELLER_NAME + "\n", headFont));
        p.add(new Chunk(InvoiceConstants.SELLER_STREET + "\n", smallFont));
        p.add(new Chunk(InvoiceConstants.SELLER_ZIP_CITY + ", " + InvoiceConstants.SELLER_COUNTRY + "\n", smallFont));
        p.add(new Chunk("UID-Nummer: " + InvoiceConstants.SELLER_UID, smallFont));
        return p;
    }

    private Paragraph recipientBlock(UserDto buyer) {
        Paragraph p = new Paragraph();
        String name = ((buyer.getFirstName() != null ? buyer.getFirstName() : "") + " "
                + (buyer.getLastName() != null ? buyer.getLastName() : "")).trim();
        p.add(new Chunk(name.isEmpty() ? "Kunde #" + buyer.getId() : name, normalFont));
        p.add(Chunk.NEWLINE);
        if (buyer.getEmail() != null) {
            p.add(new Chunk(buyer.getEmail(), normalFont));
        }
        return p;
    }

    private PdfPTable metaTable(Payment payment, UserDto buyer) {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(60);
        table.setHorizontalAlignment(Element.ALIGN_LEFT);

        String issueDate = DATE_FMT.format(payment.getInvoiceIssuedAt().atZone(ZoneId.of("Europe/Vienna")));
        addMetaRow(table, "Rechnungsnummer", payment.getInvoiceNumber());
        addMetaRow(table, "Rechnungsdatum", issueDate);
        if (payment.getBookingDate() != null) {
            addMetaRow(table, "Leistungsdatum", DATE_FMT.format(payment.getBookingDate()));
        }
        addMetaRow(table, "Kundennummer", String.valueOf(buyer.getId()));
        return table;
    }

    private void addMetaRow(PdfPTable table, String label, String value) {
        table.addCell(borderlessCell(label, boldFont, 2));
        table.addCell(borderlessCell(value, normalFont, 2));
    }

    private PdfPTable itemsTable(Payment payment, Amounts amounts) {
        PdfPTable table = new PdfPTable(new float[]{4f, 1.2f, 1.6f, 1.6f});
        table.setWidthPercentage(100);

        table.addCell(headerCell("Beschreibung"));
        table.addCell(headerCell("Menge"));
        table.addCell(headerCell("Einzelpreis netto"));
        table.addCell(headerCell("Gesamt netto"));

        String description = "Cube-Buchung – " + (payment.getStudioName() != null ? payment.getStudioName() : "Cube");
        String qty = payment.getDurationHours().stripTrailingZeros().toPlainString() + " Std.";
        BigDecimal unitNet = payment.getDurationHours().compareTo(BigDecimal.ZERO) > 0
                ? amounts.netBase().divide(payment.getDurationHours(), 2, RoundingMode.HALF_UP)
                : amounts.netBase();

        table.addCell(cell(description, normalFont));
        table.addCell(cell(qty, normalFont));
        table.addCell(cell(formatEuro(unitNet), normalFont));
        table.addCell(cell(formatEuro(amounts.netBase()), normalFont));

        if (amounts.netDiscount().compareTo(BigDecimal.ZERO) > 0) {
            table.addCell(cell("Gutschein-Rabatt", normalFont));
            table.addCell(cell("", normalFont));
            table.addCell(cell("", normalFont));
            table.addCell(cell("-" + formatEuro(amounts.netDiscount()), normalFont));
        }

        return table;
    }

    private PdfPTable summaryTable(Amounts amounts) {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(45);
        table.setHorizontalAlignment(Element.ALIGN_RIGHT);

        addSummaryRow(table, "Nettobetrag", formatEuro(amounts.netTotal()), normalFont);
        addSummaryRow(table, "zzgl. 20% USt", formatEuro(amounts.vatTotal()), normalFont);
        addSummaryRow(table, "Gesamtbetrag", formatEuro(amounts.grossTotal()), boldFont);
        return table;
    }

    private void addSummaryRow(PdfPTable table, String label, String value, Font font) {
        PdfPCell l = borderlessCell(label, font, 1);
        l.setHorizontalAlignment(Element.ALIGN_LEFT);
        table.addCell(l);
        PdfPCell v = borderlessCell(value, font, 1);
        v.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(v);
    }

    private Paragraph footerBlock() {
        Paragraph p = new Paragraph();
        p.add(new Chunk("Zahlungsart: Kreditkarte (Stripe) – Betrag wurde bereits beglichen.\n", smallFont));
        p.add(new Chunk("Diese Rechnung wurde elektronisch erstellt und ist auch ohne Unterschrift gültig.\n", smallFont));
        p.add(new Chunk(InvoiceConstants.SELLER_NAME + " · " + InvoiceConstants.SELLER_EMAIL + " · " + InvoiceConstants.SELLER_PHONE, smallFont));
        return p;
    }

    private PdfPCell headerCell(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, tableHeaderFont));
        cell.setBackgroundColor(BRAND_ORANGE);
        cell.setPadding(6);
        return cell;
    }

    private PdfPCell cell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(6);
        return cell;
    }

    private PdfPCell borderlessCell(String text, Font font, int paddingBottom) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPaddingBottom(paddingBottom);
        return cell;
    }

    private String formatEuro(BigDecimal amount) {
        return String.format(Locale.GERMANY, "€ %,.2f", amount);
    }

    /** Gross amounts are the source of truth (Stripe charges gross); net/VAT are derived from them
     *  independently per figure, so summary net + VAT always reconciles exactly to the gross total. */
    private record Amounts(BigDecimal netBase, BigDecimal netDiscount, BigDecimal netTotal,
                            BigDecimal vatTotal, BigDecimal grossTotal) {
        static Amounts from(Payment payment) {
            BigDecimal grossBase = centsToEuros(payment.getBaseAmountCents());
            BigDecimal grossDiscount = centsToEuros(payment.getDiscountAmountCents());
            BigDecimal grossTotal = centsToEuros(payment.getFinalAmountCents());

            BigDecimal netBase = toNet(grossBase);
            BigDecimal netDiscount = toNet(grossDiscount);
            BigDecimal netTotal = toNet(grossTotal);
            BigDecimal vatTotal = grossTotal.subtract(netTotal);

            return new Amounts(netBase, netDiscount, netTotal, vatTotal, grossTotal);
        }

        private static BigDecimal centsToEuros(Integer cents) {
            return BigDecimal.valueOf(cents == null ? 0 : cents).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }

        private static BigDecimal toNet(BigDecimal gross) {
            return gross.divide(BigDecimal.ONE.add(InvoiceConstants.VAT_RATE), 2, RoundingMode.HALF_UP);
        }
    }
}
