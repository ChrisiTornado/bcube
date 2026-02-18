package com.bcube.studioservice.controller;

import com.bcube.studioservice.service.StudioService;
import com.bcube.studioservice.service.dto.request.CreateStudioRequest;
import com.bcube.studioservice.service.dto.request.UpdateStudioRequest;
import com.bcube.studioservice.service.dto.response.ApiResponse;
import com.bcube.studioservice.service.dto.response.StudioNameResponse;
import com.bcube.studioservice.service.dto.response.StudioResponse;
import com.bcube.studioservice.service.impl.StudioServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/studios")
public class StudioController {
    private final StudioService studioService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<StudioResponse>>> getAllStudios(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size)   {
        Page<StudioResponse> response = studioService.getAllStudios(page, size);
        return ResponseEntity.ok(new ApiResponse<>("Studios erfolgreich gesendet", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StudioResponse>> getStudioById(@PathVariable long id)   {
        StudioResponse response = studioService.getStudioById(id);
        return ResponseEntity.ok(new ApiResponse<>("Studio erfolgreich gesendet", response));
    }

    @GetMapping("/filters")
    public ResponseEntity<ApiResponse<Page<StudioNameResponse>>> getBookingsStudios(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        Page<StudioNameResponse> studios = studioService.getAllStudioNames(page, size);
        return ResponseEntity.ok(new ApiResponse<>("Studiennamen erfolgreich geladen", studios));
    }
}