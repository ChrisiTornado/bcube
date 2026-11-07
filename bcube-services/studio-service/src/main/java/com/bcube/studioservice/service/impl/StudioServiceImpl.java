package com.bcube.studioservice.service.impl;

import com.bcube.studioservice.persistance.entity.Studio;
import com.bcube.studioservice.persistance.repository.StudioRepository;
import com.bcube.studioservice.service.StudioService;
import com.bcube.studioservice.service.dto.response.StudioNameResponse;
import com.bcube.studioservice.service.dto.response.StudioResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;


@Service
@RequiredArgsConstructor
public class StudioServiceImpl implements StudioService {
    private final StudioRepository studioRepository;
    private final StudioMapper studioMapper;
    private final StudioImageService studioImageService;

    @Override
    public Page<StudioResponse> getStudiosPagination(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Studio> studios = studioRepository.findAll(pageable);
        return new PageImpl<>(studioMapper.toList(studios.getContent()), pageable, studios.getTotalElements());
    }

    @Override
    public StudioResponse getStudioById(long id) {
        Studio studio = findStudio(id);
        return studioMapper.toDetail(studio, studioImageService.imagesOf(id));
    }

    @Override
    public StudioResponse getStudioSummaryById(long id) {
        return studioMapper.toSummary(findStudio(id));
    }

    private Studio findStudio(long id) {
        return studioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Studio mit ID " + id + " nicht gefunden"));
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
        return studioMapper.toList(studioRepository.findAll()).toArray(new StudioResponse[0]);
    }
}
