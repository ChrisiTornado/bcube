package com.bcube.accessservice.service;

import com.bcube.accessservice.service.dto.request.AccessRequest;
import com.bcube.accessservice.service.dto.response.AccessResponse;
import com.bcube.accessservice.service.dto.response.StornoResponse;

public interface AccessService {
    AccessResponse createPermission(AccessRequest accessRequest);
    StornoResponse deletePermission(Long id);
    AccessResponse getPinCode(Long id);
}
