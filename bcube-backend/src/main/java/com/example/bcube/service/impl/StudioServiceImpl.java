package com.example.bcube.service.impl;

import com.example.bcube.persistence.entity.Studio;
import com.example.bcube.persistence.repository.StudioRepository;
import com.example.bcube.service.StudioService;
import com.example.bcube.service.dto.request.CreateStudioRequest;
import com.example.bcube.service.dto.request.UpdateStudioRequest;
import com.example.bcube.service.dto.response.StudioResponse;
import lombok.RequiredArgsConstructor;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
@RequiredArgsConstructor
public class StudioServiceImpl implements StudioService {
    private final StudioRepository studioRepository;
    private Map<String, double[]> geocodeCache = new HashMap<>();

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
                        studio.getCreatedAt()
                ))
                .toArray(StudioResponse[]::new);
    }

    @Override
    public StudioResponse getStudioById(long id) {
        Studio studio = studioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Studio mit ID " + id + " nicht gefunden"));

        return new StudioResponse(
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
                studio.isActive(),
                studio.getCreatedAt()
        );
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
                saved.getCreatedAt()
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
                updated.getCreatedAt()
        );
    }

    private double[] geocodeCoordinates(String address) {
        try {
            String encodedAddress = URLEncoder.encode(address, StandardCharsets.UTF_8)
                    .replace("+", "%20");

            String url = "https://nominatim.openstreetmap.org/search?q=" + encodedAddress + "&format=json&limit=1";

            System.out.println("https://nominatim.openstreetmap.org/search?q=" + encodedAddress + "&format=json&limit=1");
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "geocoder-java/1.0 (mailto:christophe.andunda@gmail.com)");
            headers.set("Accept", "application/json"); // <<< WICHTIG

            HttpEntity<String> entity = new HttpEntity<>(headers);
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            JSONArray results = new JSONArray(response.getBody());

            String body = response.getBody();
            System.out.println(">>> RESPONSE: " + body);

            if (results.isEmpty()) {
                throw new IllegalArgumentException("Adresse konnte nicht gefunden werden.");
            }

            JSONObject location = results.getJSONObject(0);
            double lat = Double.parseDouble(location.getString("lat"));
            double lon = Double.parseDouble(location.getString("lon"));

            return new double[]{lat, lon};
        } catch (Exception e) {
            throw new RuntimeException("Geocoding fehlgeschlagen für Adresse: " + address, e);
        }
    }

    private Double geocodeLatitude(String address) {
        return geocodeCoordinates(address)[0];
    }

    private Double geocodeLongitude(String address) {
        return geocodeCoordinates(address)[1];
    }
}
