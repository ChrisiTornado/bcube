package com.bcube.accessservice.controller;

import com.bcube.accessservice.service.AccessService;
import com.bcube.accessservice.service.dto.request.AccessRequest;
import com.bcube.accessservice.service.dto.request.CheckInRequest;
import com.bcube.accessservice.service.dto.response.AccessCodeResponse;
import com.bcube.accessservice.service.dto.response.ApiResponse;
import com.bcube.accessservice.service.dto.response.CheckInResponse;
import com.bcube.accessservice.service.dto.response.FaceVerificationResponse;
import com.bcube.accessservice.service.dto.response.StornoResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/access")
public class AccessController {
    private final AccessService accessService;

    @PostMapping
    public ResponseEntity<ApiResponse<AccessCodeResponse>> createPermission(@RequestBody AccessRequest request) {
        AccessCodeResponse response = accessService.createPermission(request);
        return ResponseEntity.ok(new ApiResponse<>("Code erfolgreich gespeichert", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<StornoResponse>> deletePermission(@PathVariable Long id) {
        StornoResponse response = accessService.deletePermission(id);
        return ResponseEntity.ok(new ApiResponse<>("Code erfolgreich gelöscht", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AccessCodeResponse>> readPermission(@PathVariable Long id) {
        AccessCodeResponse response = accessService.getAccessCode(id);
        return ResponseEntity.ok(new ApiResponse<>("Code erfolgreich gesendet", response));
    }

    @PostMapping("/check-in")
    public ResponseEntity<ApiResponse<CheckInResponse>> checkIn(@RequestBody CheckInRequest request) {
        CheckInResponse response = accessService.checkIn(request);
        return ResponseEntity.ok(new ApiResponse<>("Code verifiziert", response));
    }

    @PostMapping(value = "/verify-face", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<FaceVerificationResponse>> verifyFace(
            @RequestPart("image") MultipartFile image,
            @RequestParam("bookingId") Long bookingId) {
        FaceVerificationResponse response = accessService.verifyFace(image, bookingId);
        return ResponseEntity.ok(new ApiResponse<>("Gesicht verifiziert", response));
    }

    @PostMapping("/generate-nuki-code/{bookingId}")
    public ResponseEntity<ApiResponse<AccessCodeResponse>> generateNukiCode(@PathVariable Long bookingId) {
        AccessCodeResponse response = accessService.generateNukiCode(bookingId);
        return ResponseEntity.ok(new ApiResponse<>("Nuki-Code generiert", response));
    }
}
