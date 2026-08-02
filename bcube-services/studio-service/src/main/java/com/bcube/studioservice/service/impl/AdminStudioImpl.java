package com.bcube.studioservice.service.impl;

import com.bcube.studioservice.exception.GeocodingException;
import com.bcube.studioservice.persistance.entity.Studio;
import com.bcube.studioservice.persistance.repository.StudioRepository;
import com.bcube.studioservice.service.AdminStudioService;
import com.bcube.studioservice.service.dto.request.CreateStudioRequest;
import com.bcube.studioservice.service.dto.request.UpdateStudioRequest;
import com.bcube.studioservice.service.dto.response.DeleteResponse;
import com.bcube.studioservice.service.dto.response.StudioResponse;
import lombok.RequiredArgsConstructor;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AdminStudioImpl implements AdminStudioService {
    private final StudioRepository studioRepository;

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

        List<byte[]> images = StudioImageMapper.normalizeImages(
                createStudioRequest.getImages(),
                createStudioRequest.getImage()
        );

        // 3. Studio-Entity bauen
        Studio studio = Studio.builder()
                .smartlockId(createStudioRequest.getSmartlockId())
                .name(createStudioRequest.getName())
                .description(createStudioRequest.getDescription())
                .street(createStudioRequest.getStreet())
                .plz(createStudioRequest.getPlz())
                .city(createStudioRequest.getCity())
                .country(createStudioRequest.getCountry())
                .image(images.isEmpty() ? null : images.get(0))
                .imageGalleryJson(StudioImageMapper.toImageGalleryJson(images))
                .isActive(true)
                .latitude(latitude)
                .longitude(longitude)
                .build();

        // 4. speichern
        Studio saved = studioRepository.save(studio);

        // 5. StudioResponse zurückgeben
        return new StudioResponse(
                saved.getId(),
                saved.getSmartlockId(),
                saved.getName(),
                saved.getDescription(),
                saved.getStreet(),
                saved.getPlz(),
                saved.getCity(),
                saved.getCountry(),
                saved.getLatitude(),
                saved.getLongitude(),
                StudioImageMapper.toDataImage(saved.getImage()),
                StudioImageMapper.toImageGalleryBase64(saved),
                saved.isActive(),
                saved.getCreatedAt()
        );
    }

    @Override
    public DeleteResponse deleteStudio(long id) {
        Optional<Studio> deletingStudio = studioRepository.findById(id);
        if (deletingStudio.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Studio nicht gefunden");
        }
        studioRepository.delete(deletingStudio.get());
        return new DeleteResponse(true);
    }

    @Override
    public StudioResponse updateStudio(long id, UpdateStudioRequest request) {
        // 1. Bestehendes Studio aus DB holen
        Studio studio = studioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Studio nicht gefunden mit ID: " + id));

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
        studio.setSmartlockId(request.getSmartlockId());
        studio.setName(request.getName());
        studio.setDescription(request.getDescription());
        studio.setStreet(request.getStreet());
        studio.setPlz(request.getPlz());
        studio.setCity(request.getCity());
        studio.setCountry(request.getCountry());
        studio.setLatitude(latitude);
        studio.setLongitude(longitude);

        List<byte[]> images = StudioImageMapper.normalizeImages(request.getImages(), request.getImage());
        if (!images.isEmpty()) {
            studio.setImage(images.get(0));
            studio.setImageGalleryJson(StudioImageMapper.toImageGalleryJson(images));
        }

        // 5. speichern
        Studio updated = studioRepository.save(studio);

        // 6. Response zurückgeben
        return new StudioResponse(
                updated.getId(),
                updated.getSmartlockId(),
                updated.getName(),
                updated.getDescription(),
                updated.getStreet(),
                updated.getPlz(),
                updated.getCity(),
                updated.getCountry(),
                updated.getLatitude(),
                updated.getLongitude(),
                StudioImageMapper.toDataImage(updated.getImage()),
                StudioImageMapper.toImageGalleryBase64(updated),
                updated.isActive(),
                updated.getCreatedAt()
        );
    }

    private Double geocodeLatitude(String address) {
        return geocodeCoordinates(address)[0];
    }

    private Double geocodeLongitude(String address) {
        return geocodeCoordinates(address)[1];
    }

    private double[] geocodeCoordinates(String address) {
        try {
            String encodedAddress = URLEncoder.encode(address, StandardCharsets.UTF_8)
                    .replace("+", "%20");

            String url = "https://nominatim.openstreetmap.org/search?q=" + encodedAddress + "&format=json&limit=1";
            System.out.println("Request URL: " + url);

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("User-Agent", "bcube (christophe.andunda@gmail.com)")
                    .header("Accept", "application/json")
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            System.out.println("Response Body: " + response.body());

            JSONArray results = new JSONArray(response.body());

            if (results.isEmpty()) {
                throw new IllegalArgumentException("Address not found: " + address);
            }

            JSONObject location = results.getJSONObject(0);
            double lat = Double.parseDouble(location.getString("lat"));
            double lon = Double.parseDouble(location.getString("lon"));

            return new double[]{lat, lon};
        } catch (Exception e) {
            throw new GeocodingException("Geocoding fehlgeschlagen für Adresse: " + address);
        }
    }
}
