package com.bcube.studioservice.startup;

import com.bcube.studioservice.persistance.entity.Studio;
import com.bcube.studioservice.persistance.repository.StudioImageRepository;
import com.bcube.studioservice.persistance.repository.StudioRepository;
import com.bcube.studioservice.service.impl.StudioImageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONArray;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

/**
 * One-time conversion of studios that still keep their images in the legacy columns (a single
 * large object plus a Base64 JSON gallery) into scaled rows in studio_images. Studios that
 * already have image rows are skipped, so this is safe to run on every start. The legacy columns
 * are left untouched; a later migration can drop them once this has run everywhere.
 */
@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class LegacyImageMigration implements CommandLineRunner {

    private final StudioRepository studioRepository;
    private final StudioImageRepository imageRepository;
    private final StudioImageService studioImageService;

    @Override
    public void run(String... args) {
        int migrated = 0;
        for (Studio studio : studioRepository.findAll()) {
            if (imageRepository.existsByStudioId(studio.getId())) {
                continue;
            }
            List<byte[]> legacy = legacyImages(studio);
            if (legacy.isEmpty()) {
                continue;
            }
            try {
                studioImageService.replaceImages(studio.getId(), legacy);
                migrated++;
            } catch (RuntimeException e) {
                log.warn("Bilder von Studio {} konnten nicht migriert werden: {}", studio.getId(), e.getMessage());
            }
        }
        if (migrated > 0) {
            log.info("{} Studio(s) auf skalierte Bilder (studio_images) migriert.", migrated);
        }
    }

    private static List<byte[]> legacyImages(Studio studio) {
        List<byte[]> images = new ArrayList<>();
        String json = studio.getImageGalleryJson();
        if (json != null && !json.isBlank()) {
            JSONArray array = new JSONArray(json);
            for (int i = 0; i < array.length(); i++) {
                String raw = array.optString(i, "");
                if (raw.isBlank()) {
                    continue;
                }
                int comma = raw.indexOf(',');
                String base64 = raw.startsWith("data:image") && comma >= 0 ? raw.substring(comma + 1) : raw;
                images.add(Base64.getDecoder().decode(base64));
            }
        }
        if (images.isEmpty() && studio.getImage() != null && studio.getImage().length > 0) {
            images.add(studio.getImage());
        }
        return images;
    }
}
