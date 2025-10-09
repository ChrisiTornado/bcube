package com.bcube.studioservice.persistance.repository;

import com.bcube.studioservice.persistance.entity.Studio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudioRepository extends JpaRepository<Studio, Long> {
    Studio findByName(String name);
    Optional<Studio> findById(Long id);
}