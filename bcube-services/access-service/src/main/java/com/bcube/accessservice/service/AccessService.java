package com.bcube.accessservice.service;

import com.bcube.accessservice.service.dto.request.AccessRequest;
import com.bcube.accessservice.service.dto.request.CheckInRequest;
import com.bcube.accessservice.service.dto.response.AccessCodeResponse;
import com.bcube.accessservice.service.dto.response.CheckInResponse;
import com.bcube.accessservice.service.dto.response.FaceVerificationResponse;
import com.bcube.accessservice.service.dto.response.StornoResponse;
import org.springframework.web.multipart.MultipartFile;

public interface AccessService {
    AccessCodeResponse createPermission(AccessRequest accessRequest);
    StornoResponse deletePermission(Long id);
    AccessCodeResponse getAccessCode(Long id);
    CheckInResponse checkIn(CheckInRequest request);
    FaceVerificationResponse verifyFace(MultipartFile image, Long bookingId);
    AccessCodeResponse generateNukiCode(Long bookingId);
}
