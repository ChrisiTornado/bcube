package com.example.bcube.controller;

import com.example.bcube.service.dto.*;
import com.example.bcube.service.impl.StudioServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class StudioController {
    @Autowired
    private StudioServiceImpl studioService;

    @GetMapping("/get-all-studios")
    public ResponseEntity<ApiResponse<StudioResponse[]>> getAllStudios()   {
        StudioResponse[] response = studioService.getAllStudios();
        return ResponseEntity.ok(new ApiResponse<>("Studios erfolgreich gesendet", response));
    }

    @GetMapping("/get-studio-by-id")
    public ResponseEntity<ApiResponse<StudioResponse>> getStudioById(@RequestParam long id)   {
        StudioResponse response = studioService.getStudioById(id);
        return ResponseEntity.ok(new ApiResponse<>("Studio erfolgreich gesendet", response));
    }

    @PostMapping("/admin/create-studio")
    public ResponseEntity<ApiResponse<StudioResponse>> createStudio(@Valid @RequestBody CreateStudioRequest createStudioRequest) {
        StudioResponse response = studioService.createStudio(createStudioRequest);
        return ResponseEntity.ok(new ApiResponse<>("Studio erfolgreich erstellt", response));
    }

    @DeleteMapping("/admin/delete-studio/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteStudio(@PathVariable long id) {
        studioService.deleteStudio(id);
        return ResponseEntity.ok(new ApiResponse<>("Studio erfolgreich gelöscht", null));
    }

    @PutMapping("/admin/update-studio/{id}")
    public ResponseEntity<ApiResponse<StudioResponse>> updateStudio(@PathVariable long id, @Valid @RequestBody UpdateStudioRequest updateStudioRequest) {
        StudioResponse response = studioService.updateStudio(id, updateStudioRequest);
        return ResponseEntity.ok(new ApiResponse<>("Studio erfolgreich aktuallisiert", response));
    }
}
