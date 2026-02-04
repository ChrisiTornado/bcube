package com.bcube.accessservice.persistance.repository;

import com.bcube.accessservice.persistance.entity.AccessPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AccessRepository extends JpaRepository<AccessPermission, Long> {
}