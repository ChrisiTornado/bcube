package com.bcube.studioservice.service;

import com.bcube.studioservice.service.dto.request.CreateStudioRequest;
import com.bcube.studioservice.service.dto.request.UpdateStudioRequest;
import com.bcube.studioservice.service.dto.response.StudioResponse;

public interface StudioService {
    StudioResponse[] getAllStudios();
    StudioResponse getStudioById(long id);
    StudioResponse createStudio(CreateStudioRequest createStudioRequest);
    void deleteStudio(long id);
    StudioResponse updateStudio(long id, UpdateStudioRequest updateStudioRequest);
}