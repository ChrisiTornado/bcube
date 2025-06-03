package com.example.bcube.service;

import com.example.bcube.service.dto.CreateStudioRequest;
import com.example.bcube.service.dto.StudioResponse;
import com.example.bcube.service.dto.UpdateStudioRequest;

public interface StudioService {
    StudioResponse[] getAllStudios();
    StudioResponse getStudioById(long id);
    StudioResponse createStudio(CreateStudioRequest createStudioRequest);
    void deleteStudio(long id);
    StudioResponse updateStudio(long id, UpdateStudioRequest updateStudioRequest);
}
