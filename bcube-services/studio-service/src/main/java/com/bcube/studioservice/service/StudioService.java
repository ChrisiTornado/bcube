package com.bcube.studioservice.service;

import com.bcube.studioservice.service.dto.request.CreateStudioRequest;
import com.bcube.studioservice.service.dto.request.UpdateStudioRequest;
import com.bcube.studioservice.service.dto.response.DeleteResponse;
import com.bcube.studioservice.service.dto.response.StudioNameResponse;
import com.bcube.studioservice.service.dto.response.StudioResponse;
import org.springframework.data.domain.Page;

public interface StudioService {
    Page<StudioResponse> getAllStudios(int page, int size);
    StudioResponse getStudioById(long id);
    Page<StudioNameResponse> getAllStudioNames(int page, int size);
}