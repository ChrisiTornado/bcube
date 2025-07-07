package com.example.bcube.persistence.repository;

import com.example.bcube.persistence.entity.Studio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudioRepository extends JpaRepository<Studio, Long> {
    Studio findByName(String name);
    Optional<Studio> findById(Long id);
}
