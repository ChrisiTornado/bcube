package com.bcube.studioservice.service.impl;

import com.bcube.studioservice.persistance.entity.Studio;
import org.json.JSONArray;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

final class StudioImageMapper {
    private StudioImageMapper() {
    }

    static String toDataImage(byte[] image) {
        if (image == null || image.length == 0) {
            return null;
        }

        return "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(image);
    }

    static List<String> toImageGalleryBase64(Studio studio) {
        List<String> gallery = new ArrayList<>();

        if (studio.getImageGalleryJson() != null && !studio.getImageGalleryJson().isBlank()) {
            JSONArray array = new JSONArray(studio.getImageGalleryJson());
            for (int i = 0; i < array.length(); i++) {
                String raw = array.optString(i, "");
                if (!raw.isBlank()) {
                    gallery.add(raw.startsWith("data:image") ? raw : "data:image/jpeg;base64," + raw);
                }
            }
        }

        if (gallery.isEmpty() && studio.getImage() != null && studio.getImage().length > 0) {
            gallery.add(toDataImage(studio.getImage()));
        }

        return gallery;
    }

    static String toImageGalleryJson(List<byte[]> images) {
        JSONArray array = new JSONArray();
        if (images == null) {
            return array.toString();
        }

        for (byte[] image : images) {
            if (image != null && image.length > 0) {
                array.put(Base64.getEncoder().encodeToString(image));
            }
        }

        return array.toString();
    }

    static List<byte[]> normalizeImages(List<byte[]> images, byte[] fallbackImage) {
        List<byte[]> normalized = new ArrayList<>();

        if (images != null) {
            for (byte[] image : images) {
                if (image != null && image.length > 0) {
                    normalized.add(image);
                }
            }
        }

        if (normalized.isEmpty() && fallbackImage != null && fallbackImage.length > 0) {
            normalized.add(fallbackImage);
        }

        return normalized;
    }
}
