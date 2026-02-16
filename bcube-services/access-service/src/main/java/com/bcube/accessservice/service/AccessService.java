package com.bcube.accessservice.service;

import com.bcube.accessservice.service.dto.request.AccessRequest;
import com.bcube.accessservice.service.dto.response.AccessCodeResponse;
import com.bcube.accessservice.service.dto.response.StornoResponse;

public interface AccessService {
    AccessCodeResponse createPermission(AccessRequest accessRequest);
    StornoResponse deletePermission(Long id);
    AccessCodeResponse getAccessCode(Long id);
}
