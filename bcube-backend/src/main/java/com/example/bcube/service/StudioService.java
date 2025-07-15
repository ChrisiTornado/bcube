package com.example.bcube.service;

import com.example.bcube.service.dto.request.CreateStudioRequest;
import com.example.bcube.service.dto.response.StudioResponse;
import com.example.bcube.service.dto.request.UpdateStudioRequest;

public interface StudioService {
    StudioResponse[] getAllStudios();
    StudioResponse getStudioById(long id);
    StudioResponse createStudio(CreateStudioRequest createStudioRequest);
    void deleteStudio(long id);
    StudioResponse updateStudio(long id, UpdateStudioRequest updateStudioRequest);
    
}
