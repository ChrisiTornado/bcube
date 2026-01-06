package com.bcube.studioservice.persistance.repository;

import com.bcube.studioservice.persistance.entity.Studio;
import com.bcube.studioservice.service.dto.response.StudioNameResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudioRepository extends JpaRepository<Studio, Long> {
    Studio findByName(String name);
    Optional<Studio> findById(Long id);

    @Query("""
         select new com.bcube.studioservice.service.dto.response.StudioNameResponse(
              studio.id,
              studio.name
         )
         from Studio studio
    """)
    Page<StudioNameResponse> getAllStudioNames(Pageable pageable);
}