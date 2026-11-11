package com.bcube.studioservice.service.impl;

import org.springframework.stereotype.Component;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.MemoryCacheImageOutputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

/**
 * Scales an uploaded image to the two sizes the API serves: a small thumbnail for lists and a
 * display-sized image for detail views, both as JPEG. Originals are not kept - a phone photo is
 * several MB and nothing in the app shows it at that size.
 */
@Component
public class StudioImageProcessor {

    static final int FULL_MAX_PX = 1600;
    static final int THUMB_MAX_PX = 480;
    private static final float FULL_QUALITY = 0.85f;
    private static final float THUMB_QUALITY = 0.8f;

    public record Processed(byte[] full, byte[] thumb) {
    }

    public Processed process(byte[] original) {
        BufferedImage source;
        try {
            source = ImageIO.read(new ByteArrayInputStream(original));
        } catch (IOException e) {
            throw new IllegalArgumentException("Das hochgeladene Bild konnte nicht gelesen werden.", e);
        }
        if (source == null) {
            throw new IllegalArgumentException("Das hochgeladene Bild ist ungültig oder hat ein nicht unterstütztes Format.");
        }
        return new Processed(
                encodeJpeg(scaleToFit(source, FULL_MAX_PX), FULL_QUALITY),
                encodeJpeg(scaleToFit(source, THUMB_MAX_PX), THUMB_QUALITY));
    }

    /** Fits the longest side into {@code maxPx} (never upscales), halving stepwise for sharper results. */
    private static BufferedImage scaleToFit(BufferedImage source, int maxPx) {
        int longest = Math.max(source.getWidth(), source.getHeight());
        BufferedImage current = toRgb(source);
        if (longest <= maxPx) {
            return current;
        }
        double ratio = (double) maxPx / longest;
        int targetW = Math.max(1, (int) Math.round(source.getWidth() * ratio));
        int targetH = Math.max(1, (int) Math.round(source.getHeight() * ratio));
        while (current.getWidth() / 2 >= targetW && current.getHeight() / 2 >= targetH) {
            current = resize(current, current.getWidth() / 2, current.getHeight() / 2);
        }
        return resize(current, targetW, targetH);
    }

    private static BufferedImage resize(BufferedImage image, int width, int height) {
        BufferedImage out = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = out.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.drawImage(image, 0, 0, width, height, null);
        } finally {
            g.dispose();
        }
        return out;
    }

    /** JPEG has no alpha channel, so transparent PNGs are flattened onto white. */
    private static BufferedImage toRgb(BufferedImage image) {
        if (image.getType() == BufferedImage.TYPE_INT_RGB) {
            return image;
        }
        BufferedImage out = new BufferedImage(image.getWidth(), image.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D g = out.createGraphics();
        try {
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, out.getWidth(), out.getHeight());
            g.drawImage(image, 0, 0, null);
        } finally {
            g.dispose();
        }
        return out;
    }

    private static byte[] encodeJpeg(BufferedImage image, float quality) {
        ImageWriter writer = ImageIO.getImageWritersByFormatName("jpeg").next();
        ImageWriteParam param = writer.getDefaultWriteParam();
        param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        param.setCompressionQuality(quality);
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        try (MemoryCacheImageOutputStream out = new MemoryCacheImageOutputStream(bytes)) {
            writer.setOutput(out);
            writer.write(null, new IIOImage(image, null, null), param);
        } catch (IOException e) {
            throw new IllegalStateException("Bild konnte nicht kodiert werden.", e);
        } finally {
            writer.dispose();
        }
        return bytes.toByteArray();
    }
}
