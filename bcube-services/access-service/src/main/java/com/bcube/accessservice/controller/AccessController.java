package com.bcube.accessservice.controller;
import com.bcube.accessservice.persistance.entity.AccessPermission;
import com.bcube.accessservice.service.AccessService;
import com.bcube.accessservice.service.dto.request.AccessRequest;
import com.bcube.accessservice.service.dto.response.AccessResponse;
import com.bcube.accessservice.service.dto.response.ApiResponse;
import com.bcube.accessservice.service.dto.response.StornoResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/access")
public class AccessController {
    private final AccessService accessService;

    @PostMapping
    public ResponseEntity<ApiResponse<AccessResponse>> createPermission(@RequestBody AccessRequest request) {
        AccessResponse response = accessService.createPermission(request);
        return ResponseEntity.ok(new ApiResponse<>("Code erfolgreich gesendet",  response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<StornoResponse>> deletePermission(@PathVariable Long id) {
        StornoResponse response = accessService.deletePermission(id);
        return ResponseEntity.ok(new ApiResponse<>("Code erfolgreich gelöscht", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AccessResponse>> readPermission(@PathVariable Long id) {
        AccessResponse response = accessService.getPinCode(id);
        return ResponseEntity.ok(new ApiResponse<>("Code erfolgreich gesendet", response));
    }

    // ToDo: clean up job
}
