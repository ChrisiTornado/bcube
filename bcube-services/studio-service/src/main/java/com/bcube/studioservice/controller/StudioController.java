package com.bcube.studioservice.controller;

import com.bcube.studioservice.persistance.entity.StudioImage;
import com.bcube.studioservice.service.impl.StudioImageService;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestHeader;
import java.time.Duration;
import com.bcube.studioservice.service.StudioService;
import com.bcube.studioservice.service.dto.response.ApiResponse;
import com.bcube.studioservice.service.dto.response.StudioNameResponse;
import com.bcube.studioservice.service.dto.response.StudioResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/studios")
public class StudioController {
    private final StudioService studioService;
    private final StudioImageService studioImageService;

    @GetMapping
    public ResponseEntity<ApiResponse<StudioResponse[]>> getStudios() {
        StudioResponse[] response = studioService.getAllStudios();
        return ResponseEntity.ok(new ApiResponse<>("Studios erfolgreich gesendet", response));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<Page<StudioResponse>>> getStudiosPagination(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size)   {
        Page<StudioResponse> response = studioService.getStudiosPagination(page, size);
        return ResponseEntity.ok(new ApiResponse<>("Studios erfolgreich gesendet", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StudioResponse>> getStudioById(@PathVariable long id)   {
        StudioResponse response = studioService.getStudioById(id);
        return ResponseEntity.ok(new ApiResponse<>("Studio erfolgreich gesendet", response));
    }

    /** Lightweight variant of {@code /{id}} without the image gallery - used by booking-service. */
    @GetMapping("/{id}/summary")
    public ResponseEntity<ApiResponse<StudioResponse>> getStudioSummaryById(@PathVariable long id) {
        StudioResponse response = studioService.getStudioSummaryById(id);
        return ResponseEntity.ok(new ApiResponse<>("Studio erfolgreich gesendet", response));
    }

    /**
     * Serves one gallery image. The URLs handed out in {@code thumbnailUrl}/{@code imageUrls} carry
     * the image's etag in {@code v=}, so a changed image gets a new URL and responses can be cached
     * for a year.
     */
    @GetMapping("/{id}/images/{position}")
    public ResponseEntity<byte[]> getStudioImage(
            @PathVariable long id,
            @PathVariable int position,
            @RequestParam(defaultValue = "full") String size,
            @RequestHeader(value = HttpHeaders.IF_NONE_MATCH, required = false) String ifNoneMatch
    ) {
        StudioImage image = studioImageService.find(id, position);
        if (image == null) {
            return ResponseEntity.notFound().build();
        }
        String etag = "\"" + image.getEtag() + (size.equals("thumb") ? "-t" : "") + "\"";
        if (etag.equals(ifNoneMatch)) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED).eTag(etag).build();
        }
        byte[] data = size.equals("thumb") ? image.getThumbData() : image.getFullData();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.getContentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
                .eTag(etag)
                .body(data);
    }

    @GetMapping("/filters")
    public ResponseEntity<ApiResponse<Page<StudioNameResponse>>> getBookingsStudios(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        Page<StudioNameResponse> studios = studioService.getAllStudioNames(page, size);
        return ResponseEntity.ok(new ApiResponse<>("Studiennamen erfolgreich geladen", studios));
    }
}