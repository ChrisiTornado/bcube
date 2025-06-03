package com.example.bcube.service.impl;

import com.example.bcube.persistence.entity.Role;
import com.example.bcube.persistence.entity.Studio;
import com.example.bcube.persistence.repository.StudioRepository;
import com.example.bcube.service.StudioService;
import com.example.bcube.service.dto.CreateStudioRequest;
import com.example.bcube.service.dto.StudioResponse;
import com.example.bcube.service.dto.UpdateStudioRequest;
import com.example.bcube.service.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Base64;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StudioServiceImpl implements StudioService {
    private final StudioRepository studioRepository;

    @Override
    public StudioResponse[] getAllStudios() {
        List<Studio> studioList = studioRepository.findAll();
        return studioList.stream()
                .map(studio -> new StudioResponse(
                        studio.getId(),
                        studio.getName(),
                        studio.getDescription(),
                        studio.getStreet(),
                        studio.getPlz(),
                        studio.getCity(),
                        studio.getCountry(),
                        studio.getLatitude(),
                        studio.getLongitude(),
                        studio.getImage() != null
                                ? "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(studio.getImage())
                                : null,
                        true,
                        studio.getCreatedAt(),
                        studio.getUsers().stream()
                                .map(user -> new UserResponse(
                                        user.getId(),
                                        user.getRole() == Role.ADMIN,
                                        user.getEmail(),
                                        user.getFirstName(),
                                        user.getLastName(),
                                        user.getPhone()
                                ))
                                .toList()
                ))
                .toArray(StudioResponse[]::new);
    }

    @Override
    public StudioResponse createStudio(CreateStudioRequest createStudioRequest) {
        // 1. Adresse zusammenbauen
        String fullAddress = String.format("%s, %d %s, %s",
                createStudioRequest.getStreet(),
                createStudioRequest.getPlz(),
                createStudioRequest.getCity(),
                createStudioRequest.getCountry());

        // 2. Geolocation bestimmen (hier Dummywerte oder externen Service aufrufen)
        Double latitude = geocodeLatitude(fullAddress);
        Double longitude = geocodeLongitude(fullAddress);

        // 3. Studio-Entity bauen
        Studio studio = Studio.builder()
                .name(createStudioRequest.getName())
                .description(createStudioRequest.getDescription())
                .street(createStudioRequest.getStreet())
                .plz(createStudioRequest.getPlz())
                .city(createStudioRequest.getCity())
                .country(createStudioRequest.getCountry())
                .image(createStudioRequest.getImage())
                .isActive(true)
                .latitude(latitude)
                .longitude(longitude)
                .build();

        // 4. speichern
        Studio saved = studioRepository.save(studio);

        // 5. StudioResponse zurückgeben
        return new StudioResponse(
                saved.getId(),
                saved.getName(),
                saved.getDescription(),
                saved.getStreet(),
                saved.getPlz(),
                saved.getCity(),
                saved.getCountry(),
                saved.getLatitude(),
                saved.getLongitude(),
                studio.getImage() != null
                        ? "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(studio.getImage())
                        : null,
                saved.isActive(),
                saved.getCreatedAt(),
                List.of()
        );
    }

    @Override
    public void deleteStudio(long id) {
        Optional<Studio> deletingStudio = studioRepository.findById(id);
        if (deletingStudio.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Studio nicht gefunden");
        }
        studioRepository.delete(deletingStudio.get());
    }

    @Override
    public StudioResponse updateStudio(long id, UpdateStudioRequest request) {
        // 1. Bestehendes Studio aus DB holen
        Studio studio = studioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Studio nicht gefunden mit ID: " + request.getId()));

        // 2. Adresse zusammensetzen für Geocoding
        String fullAddress = String.format("%s, %d %s, %s",
                request.getStreet(),
                request.getPlz(),
                request.getCity(),
                request.getCountry());

        // 3. Geolocation aktualisieren (Dummy oder realer Service)
        Double latitude = geocodeLatitude(fullAddress);
        Double longitude = geocodeLongitude(fullAddress);

        // 4. Felder aktualisieren
        studio.setName(request.getName());
        studio.setDescription(request.getDescription());
        studio.setStreet(request.getStreet());
        studio.setPlz(request.getPlz());
        studio.setCity(request.getCity());
        studio.setCountry(request.getCountry());
        studio.setLatitude(latitude);
        studio.setLongitude(longitude);

        if (request.getImage() != null) {
            studio.setImage(request.getImage());
        }

        // 5. speichern
        Studio updated = studioRepository.save(studio);

        // 6. Response zurückgeben
        return new StudioResponse(
                updated.getId(),
                updated.getName(),
                updated.getDescription(),
                updated.getStreet(),
                updated.getPlz(),
                updated.getCity(),
                updated.getCountry(),
                updated.getLatitude(),
                updated.getLongitude(),
                updated.getImage() != null
                        ? "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(updated.getImage())
                        : null,
                updated.isActive(),
                updated.getCreatedAt(),
                List.of()
        );
    }

    private Double geocodeLatitude(String address) {
        // TODO: echten Geocoder einbauen
        return 48.2082; // Beispiel: Wien
    }

    private Double geocodeLongitude(String address) {
        // TODO: echten Geocoder einbauen
        return 16.3738; // Beispiel: Wien
    }
}
