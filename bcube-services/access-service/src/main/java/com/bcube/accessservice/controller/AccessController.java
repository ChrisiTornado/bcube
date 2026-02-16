package com.bcube.accessservice.controller;
import com.bcube.accessservice.service.AccessService;
import com.bcube.accessservice.service.dto.request.AccessRequest;
import com.bcube.accessservice.service.dto.response.AccessCodeResponse;
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
    public ResponseEntity<ApiResponse<AccessCodeResponse>> createPermission(@RequestBody AccessRequest request) {
        AccessCodeResponse response = accessService.createPermission(request);
        System.out.println(response);
        return ResponseEntity.ok(new ApiResponse<>("Code erfolgreich gesendet",  response));
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

    // ToDo: clean up job
}
