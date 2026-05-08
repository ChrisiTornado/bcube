package com.bcube.studioservice.service.impl;

import com.bcube.studioservice.exception.GeocodingException;
import com.bcube.studioservice.persistance.entity.Studio;
import com.bcube.studioservice.persistance.repository.StudioRepository;
import com.bcube.studioservice.service.StudioService;
import com.bcube.studioservice.service.dto.request.CreateStudioRequest;
import com.bcube.studioservice.service.dto.request.UpdateStudioRequest;
import com.bcube.studioservice.service.dto.response.DeleteResponse;
import com.bcube.studioservice.service.dto.response.StudioNameResponse;
import com.bcube.studioservice.service.dto.response.StudioResponse;
import lombok.RequiredArgsConstructor;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StudioServiceImpl implements StudioService {
    private final StudioRepository studioRepository;

    @Override
    public Page<StudioResponse> getStudiosPagination(int page, int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<Studio> studioList = studioRepository.findAll(pageable);

        return studioList.map(studio -> new StudioResponse(
                        studio.getId(),
                        studio.getName(),
                        studio.getDescription(),
                        studio.getStreet(),
                        studio.getPlz(),
                        studio.getCity(),
                        studio.getCountry(),
                        studio.getLatitude(),
                        studio.getLongitude(),
                        StudioImageMapper.toDataImage(studio.getImage()),
                        StudioImageMapper.toImageGalleryBase64(studio),
                        true,
                        studio.getCreatedAt()
                ));
    }

    @Override
    public StudioResponse getStudioById(long id) {
        Studio studio = studioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Studio mit ID " + id + " nicht gefunden"));

        return new StudioResponse(
                studio.getId(),
                studio.getName(),
                studio.getDescription(),
                studio.getStreet(),
                studio.getPlz(),
                studio.getCity(),
                studio.getCountry(),
                studio.getLatitude(),
                studio.getLongitude(),
                StudioImageMapper.toDataImage(studio.getImage()),
                StudioImageMapper.toImageGalleryBase64(studio),
                studio.isActive(),
                studio.getCreatedAt()
        );
    }



    @Override
    public Page<StudioNameResponse> getAllStudioNames(int page, int size) {
        Sort sort = Sort.by(Sort.Direction.ASC, "name");
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<StudioNameResponse> result = studioRepository.getAllStudioNames(pageable);

        return result;
    }

    @Override
    public StudioResponse[] getAllStudios() {
        List<Studio> studios = studioRepository.findAll();

        List<StudioResponse> response = studios.stream()
                .map(studio -> new StudioResponse(
                        studio.getId(),
                        studio.getName(),
                        studio.getDescription(),
                        studio.getStreet(),
                        studio.getPlz(),
                        studio.getCity(),
                        studio.getCountry(),
                        studio.getLatitude(),
                        studio.getLongitude(),
                        StudioImageMapper.toDataImage(studio.getImage()),
                        StudioImageMapper.toImageGalleryBase64(studio),
                        studio.isActive(),
                        studio.getCreatedAt()
                )).toList();

        return response.toArray(new StudioResponse[0]);
    }
}
