package com.bcube.studioservice.service.impl;

import com.bcube.studioservice.persistance.entity.Studio;
import com.bcube.studioservice.persistance.entity.StudioImage;
import com.bcube.studioservice.persistance.repository.StudioImageRepository;
import com.bcube.studioservice.service.dto.StudioThumb;
import com.bcube.studioservice.service.dto.response.StudioResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Builds StudioResponse in three flavours so no endpoint ships more image data than it needs:
 * <ul>
 *   <li>list - thumbnails only (about 30-60 KB per image),</li>
 *   <li>detail - display-size images,</li>
 *   <li>summary - the first thumbnail only, no gallery (service-to-service).</li>
 * </ul>
 * The legacy fields {@code imageBase64}/{@code imageGalleryBase64} keep their data-URI shape so
 * existing clients keep working; {@code thumbnailUrl}/{@code imageUrls} point at the image endpoint
 * for clients that load images themselves.
 */
@Component
@RequiredArgsConstructor
public class StudioMapper {

    private static final String DATA_PREFIX = "data:image/jpeg;base64,";

    private final StudioImageRepository imageRepository;

    public List<StudioResponse> toList(List<Studio> studios) {
        if (studios.isEmpty()) {
            return List.of();
        }
        Map<Long, List<StudioThumb>> thumbs = imageRepository
                .findThumbs(studios.stream().map(Studio::getId).toList())
                .stream()
                .collect(Collectors.groupingBy(StudioThumb::studioId));

        return studios.stream().map(studio -> {
            List<StudioThumb> mine = thumbs.getOrDefault(studio.getId(), Collections.emptyList());
            List<String> gallery = mine.stream().map(t -> dataUri(t.data())).toList();
            return build(studio,
                    gallery.isEmpty() ? null : gallery.get(0),
                    gallery,
                    mine.isEmpty() ? null : url(studio.getId(), 0, "thumb", mine.get(0).etag()),
                    mine.stream().map(t -> url(studio.getId(), t.position(), "full", t.etag())).toList());
        }).toList();
    }

    public StudioResponse toDetail(Studio studio, List<StudioImage> images) {
        List<String> gallery = images.stream().map(i -> dataUri(i.getFullData())).toList();
        return build(studio,
                gallery.isEmpty() ? null : gallery.get(0),
                gallery,
                images.isEmpty() ? null : url(studio.getId(), 0, "thumb", images.get(0).getEtag()),
                images.stream().map(i -> url(studio.getId(), i.getPosition(), "full", i.getEtag())).toList());
    }

    public StudioResponse toSummary(Studio studio) {
        List<StudioThumb> thumbs = imageRepository.findThumbs(List.of(studio.getId()));
        StudioThumb first = thumbs.isEmpty() ? null : thumbs.get(0);
        return build(studio,
                first == null ? null : dataUri(first.data()),
                List.of(),
                first == null ? null : url(studio.getId(), 0, "thumb", first.etag()),
                thumbs.stream().map(t -> url(studio.getId(), t.position(), "full", t.etag())).toList());
    }

    private StudioResponse build(Studio studio, String imageBase64, List<String> gallery,
                                 String thumbnailUrl, List<String> imageUrls) {
        return new StudioResponse(
                studio.getId(),
                studio.getSmartlockId(),
                studio.getName(),
                studio.getDescription(),
                studio.getStreet(),
                studio.getPlz(),
                studio.getCity(),
                studio.getCountry(),
                studio.getLatitude(),
                studio.getLongitude(),
                imageBase64,
                gallery,
                studio.isActive(),
                studio.getCreatedAt(),
                studio.getHourlyRateCents(),
                thumbnailUrl,
                imageUrls
        );
    }

    private static String dataUri(byte[] jpeg) {
        return DATA_PREFIX + Base64.getEncoder().encodeToString(jpeg);
    }

    /** The etag in the query string makes the URL change whenever the image does, so it can be cached forever. */
    private static String url(Long studioId, int position, String size, String etag) {
        return "/api/studios/" + studioId + "/images/" + position + "?size=" + size + "&v=" + etag;
    }
}
