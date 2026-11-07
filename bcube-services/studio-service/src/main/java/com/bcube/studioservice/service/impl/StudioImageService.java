package com.bcube.studioservice.service.impl;

import com.bcube.studioservice.persistance.entity.StudioImage;
import com.bcube.studioservice.persistance.repository.StudioImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

/**
 * Stores a studio's gallery as scaled JPEGs. Replacing the gallery recognises images that are
 * unchanged - clients send the whole gallery back on update, and what they hold may be the
 * thumbnail or the display-size image they got from the API - and keeps the stored version for
 * those instead of re-processing (and degrading) a smaller copy.
 */
@Service
@RequiredArgsConstructor
public class StudioImageService {

    private final StudioImageRepository imageRepository;
    private final StudioImageProcessor processor;

    @Transactional
    public void replaceImages(long studioId, List<byte[]> incoming) {
        List<StudioImage> existing = imageRepository.findByStudioIdOrderByPosition(studioId);
        Map<String, StudioImage> byHash = new HashMap<>();
        for (StudioImage image : existing) {
            byHash.put(image.getFullSha256(), image);
            byHash.put(image.getThumbSha256(), image);
        }

        List<StudioImage> next = new ArrayList<>();
        int position = 0;
        for (byte[] raw : incoming) {
            if (raw == null || raw.length == 0) {
                continue;
            }
            StudioImage reuse = byHash.get(sha256(raw));
            next.add(reuse != null ? copyOf(reuse, studioId, position) : create(studioId, position, raw));
            position++;
        }

        imageRepository.deleteByStudioId(studioId);
        imageRepository.flush();
        imageRepository.saveAll(next);
    }

    @Transactional(readOnly = true)
    public List<StudioImage> imagesOf(long studioId) {
        return imageRepository.findByStudioIdOrderByPosition(studioId);
    }

    @Transactional(readOnly = true)
    public StudioImage find(long studioId, int position) {
        return imageRepository.findByStudioIdAndPosition(studioId, position).orElse(null);
    }

    private StudioImage create(long studioId, int position, byte[] raw) {
        StudioImageProcessor.Processed processed = processor.process(raw);
        String fullHash = sha256(processed.full());
        return StudioImage.builder()
                .studioId(studioId)
                .position(position)
                .contentType("image/jpeg")
                .fullData(processed.full())
                .thumbData(processed.thumb())
                .fullSha256(fullHash)
                .thumbSha256(sha256(processed.thumb()))
                .etag(fullHash.substring(0, 32))
                .build();
    }

    private static StudioImage copyOf(StudioImage source, long studioId, int position) {
        return StudioImage.builder()
                .studioId(studioId)
                .position(position)
                .contentType(source.getContentType())
                .fullData(source.getFullData())
                .thumbData(source.getThumbData())
                .fullSha256(source.getFullSha256())
                .thumbSha256(source.getThumbSha256())
                .etag(source.getEtag())
                .build();
    }

    static String sha256(byte[] data) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(data));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
