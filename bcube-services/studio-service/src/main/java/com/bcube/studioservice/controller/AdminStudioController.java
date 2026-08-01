package com.bcube.studioservice.controller;

import com.bcube.studioservice.service.AdminStudioService;
import com.bcube.studioservice.service.dto.request.CreateStudioRequest;
import com.bcube.studioservice.service.dto.request.UpdateStudioRequest;
import com.bcube.studioservice.service.dto.response.ApiResponse;
import com.bcube.studioservice.service.dto.response.StudioResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/studios")
public class AdminStudioController {
    private final AdminStudioService adminStudioService;

    @PostMapping
    public ResponseEntity<ApiResponse<StudioResponse>> createStudio(@Valid @RequestBody CreateStudioRequest createStudioRequest) {
        StudioResponse response = adminStudioService.createStudio(createStudioRequest);
        return ResponseEntity.ok(new ApiResponse<>("Studio erfolgreich erstellt", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteStudio(@PathVariable long id) {
        adminStudioService.deleteStudio(id);
        return ResponseEntity.ok(new ApiResponse<>("Studio erfolgreich gelöscht", null));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StudioResponse>> updateStudio(@PathVariable long id, @Valid @RequestBody UpdateStudioRequest updateStudioRequest) {
        StudioResponse response = adminStudioService.updateStudio(id, updateStudioRequest);
        return ResponseEntity.ok(new ApiResponse<>("Studio erfolgreich aktuallisiert", response));
    }
}