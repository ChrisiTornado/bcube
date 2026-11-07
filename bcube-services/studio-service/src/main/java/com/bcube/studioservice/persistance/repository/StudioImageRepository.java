package com.bcube.studioservice.persistance.repository;

import com.bcube.studioservice.persistance.entity.StudioImage;
import com.bcube.studioservice.service.dto.StudioThumb;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudioImageRepository extends JpaRepository<StudioImage, Long> {

    List<StudioImage> findByStudioIdOrderByPosition(Long studioId);

    Optional<StudioImage> findByStudioIdAndPosition(Long studioId, int position);

    boolean existsByStudioId(Long studioId);

    /** Thumbnails only - never loads the (much larger) full-size data, so list views stay cheap. */
    @Query("""
            select new com.bcube.studioservice.service.dto.StudioThumb(
                i.studioId, i.position, i.etag, i.thumbData)
            from StudioImage i
            where i.studioId in :studioIds
            order by i.studioId, i.position
            """)
    List<StudioThumb> findThumbs(@Param("studioIds") Collection<Long> studioIds);

    @Modifying
    @Query("delete from StudioImage i where i.studioId = :studioId")
    void deleteByStudioId(@Param("studioId") Long studioId);
}
