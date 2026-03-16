package com.bcube.studioservice.service;

import com.bcube.studioservice.service.dto.response.StudioNameResponse;
import com.bcube.studioservice.service.dto.response.StudioResponse;
import org.springframework.data.domain.Page;

public interface StudioService {
    Page<StudioResponse> getStudiosPagination(int page, int size);
    StudioResponse getStudioById(long id);
    Page<StudioNameResponse> getAllStudioNames(int page, int size);
    StudioResponse[] getAllStudios();
}