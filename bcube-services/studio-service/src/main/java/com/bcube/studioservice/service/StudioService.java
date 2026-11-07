package com.bcube.studioservice.service;

import com.bcube.studioservice.service.dto.response.StudioNameResponse;
import com.bcube.studioservice.service.dto.response.StudioResponse;
import org.springframework.data.domain.Page;

public interface StudioService {
    Page<StudioResponse> getStudiosPagination(int page, int size);
    StudioResponse getStudioById(long id);

    /** Same as {@link #getStudioById} but without the image gallery (tens of MB of Base64), for
     * service-to-service calls that only need the studio's basic data. */
    StudioResponse getStudioSummaryById(long id);
    Page<StudioNameResponse> getAllStudioNames(int page, int size);
    StudioResponse[] getAllStudios();
}