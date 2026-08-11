package com.bcube.studioservice.service.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.util.UUID;

/**
 * Uploads studio images to S3 instead of storing them as base64/bytea blobs in Postgres - keeps
 * the DB small and lets images be served through a CDN instead of round-tripping through the API
 * on every studio response.
 *
 * Not yet wired into AdminStudioImpl/Studio: cutting the Studio entity and the existing base64
 * fields over to this needs a real bucket to migrate the one existing studio's image data against,
 * and a corresponding frontend field rename (imageBase64 -> imageUrl) across every place that
 * currently renders it directly. Building this now so the wiring itself is a small, mechanical
 * change once AWS_S3_BUCKET is set to a real bucket.
 *
 * Credentials: intentionally not configured here - S3Client.builder() picks up the default AWS
 * credential chain (env vars locally, the task's IAM role automatically once running on ECS).
 */
@Slf4j
@Service
public class S3ImageStorageService {
    private final S3Client s3Client;
    private final String bucket;
    private final String publicUrlBase;

    public S3ImageStorageService(
            @Value("${aws.s3.region:eu-central-1}") String region,
            @Value("${aws.s3.bucket:}") String bucket,
            @Value("${aws.s3.public-url-base:}") String publicUrlBase
    ) {
        this.bucket = bucket;
        this.publicUrlBase = publicUrlBase.isBlank()
                ? "https://" + bucket + ".s3." + region + ".amazonaws.com"
                : publicUrlBase;
        this.s3Client = S3Client.builder()
                .region(Region.of(region))
                .build();
    }

    /** Uploads the image and returns its public URL. */
    public String upload(byte[] imageData, String contentType) {
        String key = "studio-images/" + UUID.randomUUID() + extensionFor(contentType);

        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .contentType(contentType)
                        .build(),
                RequestBody.fromBytes(imageData)
        );

        return publicUrlBase + "/" + key;
    }

    /** No-op (logged) if the URL isn't one of ours or the object is already gone - deletion is
     *  best-effort cleanup, never worth failing the surrounding studio update/delete over. */
    public void delete(String imageUrl) {
        if (imageUrl == null || !imageUrl.startsWith(publicUrlBase)) {
            return;
        }

        String key = imageUrl.substring(publicUrlBase.length() + 1);
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
        } catch (Exception e) {
            log.warn("Konnte S3-Objekt {} nicht löschen: {}", key, e.getMessage());
        }
    }

    private String extensionFor(String contentType) {
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> ".jpg";
        };
    }
}
