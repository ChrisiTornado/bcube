package com.bcube.studioservice.controller;

import com.bcube.studioservice.service.dto.request.CreateStudioRequest;
import com.bcube.studioservice.service.dto.request.UpdateStudioRequest;
import com.bcube.studioservice.service.dto.response.ApiResponse;
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
@RequestMapping("/api")
public class StudioController {
    @Autowired
    private final StudioServiceImpl studioService;

    @GetMapping("/studios")
    public ResponseEntity<ApiResponse<Page<StudioResponse>>> getAllStudios(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size)   {
        Page<StudioResponse> response = studioService.getAllStudios(page, size);
        return ResponseEntity.ok(new ApiResponse<>("Studios erfolgreich gesendet", response));
    }

    @GetMapping("/studios/{id}")
    public ResponseEntity<ApiResponse<StudioResponse>> getStudioById(@PathVariable long id)   {
        StudioResponse response = studioService.getStudioById(id);
        return ResponseEntity.ok(new ApiResponse<>("Studio erfolgreich gesendet", response));
    }

    @PostMapping("/admin/studios")
    public ResponseEntity<ApiResponse<StudioResponse>> createStudio(@RequestBody CreateStudioRequest createStudioRequest) {
        StudioResponse response = studioService.createStudio(createStudioRequest);
        return ResponseEntity.ok(new ApiResponse<>("Studio erfolgreich erstellt", response));
    }

    @DeleteMapping("/admin/studios/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteStudio(@PathVariable long id) {
        studioService.deleteStudio(id);
        return ResponseEntity.ok(new ApiResponse<>("Studio erfolgreich gelöscht", null));
    }

    @PutMapping("/admin/studios/{id}")
    public ResponseEntity<ApiResponse<StudioResponse>> updateStudio(@PathVariable long id, @Valid @RequestBody UpdateStudioRequest updateStudioRequest) {
        StudioResponse response = studioService.updateStudio(id, updateStudioRequest);
        return ResponseEntity.ok(new ApiResponse<>("Studio erfolgreich aktuallisiert", response));
    }
}