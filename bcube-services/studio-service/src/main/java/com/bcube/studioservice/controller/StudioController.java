package com.bcube.studioservice.controller;

import com.bcube.studioservice.service.StudioService;
import com.bcube.studioservice.service.dto.response.ApiResponse;
import com.bcube.studioservice.service.dto.response.StudioNameResponse;
import com.bcube.studioservice.service.dto.response.StudioResponse;
import com.bcube.studioservice.service.dto.response.StudioSlimResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/studios")
public class StudioController {
    private final StudioService studioService;

    @GetMapping
    public ResponseEntity<ApiResponse<StudioResponse[]>> getStudios() {
        StudioResponse[] response = studioService.getAllStudios();
        return ResponseEntity.ok(new ApiResponse<>("Studios erfolgreich gesendet", response));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<Page<StudioResponse>>> getStudiosPagination(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size)   {
        Page<StudioResponse> response = studioService.getStudiosPagination(page, size);
        return ResponseEntity.ok(new ApiResponse<>("Studios erfolgreich gesendet", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StudioResponse>> getStudioById(@PathVariable long id)   {
        StudioResponse response = studioService.getStudioById(id);
        return ResponseEntity.ok(new ApiResponse<>("Studio erfolgreich gesendet", response));
    }

    @GetMapping("/{id}/slim")
    public ResponseEntity<ApiResponse<StudioSlimResponse>> getStudioByIdSlim(@PathVariable long id) {
        StudioSlimResponse response = studioService.getStudioByIdSlim(id);
        return ResponseEntity.ok(new ApiResponse<>("Studio erfolgreich gesendet", response));
    }

    @GetMapping("/filters")
    public ResponseEntity<ApiResponse<Page<StudioNameResponse>>> getBookingsStudios(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        Page<StudioNameResponse> studios = studioService.getAllStudioNames(page, size);
        return ResponseEntity.ok(new ApiResponse<>("Studiennamen erfolgreich geladen", studios));
    }
}