package com.bcube.accessservice.service.impl;

import com.bcube.accessservice.service.AccessService;
import com.bcube.accessservice.service.dto.request.AccessRequest;
import com.bcube.accessservice.service.dto.response.AccessResponse;
import com.bcube.accessservice.service.dto.response.StornoResponse;
import org.springframework.stereotype.Service;

@Service
public class AccessServiceImpl implements AccessService {

    @Override
    public AccessResponse createPermission(AccessRequest accessRequest) {
        return null;
    }

    @Override
    public StornoResponse revokePermission(Long id) {
        return null;
    }
}