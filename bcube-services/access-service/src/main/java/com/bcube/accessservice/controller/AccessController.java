package com.bcube.accessservice.controller;
import com.bcube.accessservice.service.AccessService;
import com.bcube.accessservice.service.dto.request.AccessRequest;
import com.bcube.accessservice.service.dto.response.AccessCodeResponse;
import com.bcube.accessservice.service.dto.response.ApiResponse;
import com.bcube.accessservice.service.dto.response.StornoResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Every endpoint here manages real Nuki smart-lock access codes keyed by bookingId. There is no
 * per-user ownership to check on this side (access-service doesn't know who a booking belongs to),
 * so these routes are restricted to the one legitimate caller - booking-service, which already
 * verified the requesting user owns the booking before calling here - via the shared X-Internal-Key
 * secret instead of accepting any authenticated end-user's JWT (see WebSecurityConfig).
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/access")
public class AccessController {
    private final AccessService accessService;

    @Value("${internal.service-key}")
    private String internalServiceKey;

    private void verifyInternalKey(String providedKey) {
        if (providedKey == null || !MessageDigest.isEqual(
                providedKey.getBytes(StandardCharsets.UTF_8),
                internalServiceKey.getBytes(StandardCharsets.UTF_8)
        )) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ungültiger interner Schlüssel");
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AccessCodeResponse>> createPermission(
            @RequestHeader("X-Internal-Key") String internalKey,
            @Valid @RequestBody AccessRequest request
    ) {
        verifyInternalKey(internalKey);
        AccessCodeResponse response = accessService.createPermission(request);
        return ResponseEntity.ok(new ApiResponse<>("Code erfolgreich gesendet", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<StornoResponse>> deletePermission(
            @RequestHeader("X-Internal-Key") String internalKey,
            @PathVariable Long id
    ) {
        verifyInternalKey(internalKey);
        StornoResponse response = accessService.deletePermission(id);
        return ResponseEntity.ok(new ApiResponse<>("Code erfolgreich gelöscht", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AccessCodeResponse>> readPermission(
            @RequestHeader("X-Internal-Key") String internalKey,
            @PathVariable Long id
    ) {
        verifyInternalKey(internalKey);
        AccessCodeResponse response = accessService.getAccessCode(id);
        return ResponseEntity.ok(new ApiResponse<>("Code erfolgreich gesendet", response));
    }
}
