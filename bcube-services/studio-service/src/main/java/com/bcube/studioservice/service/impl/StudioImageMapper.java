package com.bcube.studioservice.service.impl;


import java.util.ArrayList;
import java.util.List;

final class StudioImageMapper {
    private StudioImageMapper() {
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
