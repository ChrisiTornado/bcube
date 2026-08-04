package com.bcube.studioservice.service;

import com.bcube.studioservice.service.dto.request.CreateStudioRequest;
import com.bcube.studioservice.service.dto.request.UpdateStudioRequest;
import com.bcube.studioservice.service.dto.response.DeleteResponse;
import com.bcube.studioservice.service.dto.response.StudioResponse;

public interface AdminStudioService {
    StudioResponse createStudio(CreateStudioRequest createStudioRequest);
    DeleteResponse deleteStudio(long id, String token);
    StudioResponse updateStudio(long id, UpdateStudioRequest updateStudioRequest);
}
