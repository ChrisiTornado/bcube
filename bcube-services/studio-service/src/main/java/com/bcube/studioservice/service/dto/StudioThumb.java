package com.bcube.studioservice.service.dto;

/** Projection of one thumbnail, used to build list responses without loading full-size images. */
public record StudioThumb(Long studioId, int position, String etag, byte[] data) {
}
