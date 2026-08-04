package com.bcube.studioservice.startup;

import com.bcube.studioservice.persistance.entity.Studio;
import com.bcube.studioservice.persistance.repository.StudioRepository;
import org.json.JSONArray;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Base64;

@Component
public class StudioInitializer implements CommandLineRunner {

    @Autowired
    private StudioRepository studioRepository;

    @Value("${studio.default.smartlock-id}")
    private Long defaultSmartlockId;

    // Only one studio exists at launch and will for a while - see the single-studio nav/routing
    // changes elsewhere in the app. Every studio (this one included) is required to have exactly
    // 5 real gallery images (enforced at create/update time), never padded with stock photos.
    @Override
    public void run(String... args) throws Exception {
        if (studioRepository.count() == 0) {
            byte[] render1   = loadImage("logos/new_render_1.jpg");
            byte[] interior1 = loadImage("logos/interior_1.jpeg");
            byte[] interior2 = loadImage("logos/interior_2.jpg");
            byte[] inside1   = loadImage("logos/inside 1.png");
            byte[] inside2   = loadImage("logos/inside 2.png");

            Studio studio = Studio.builder()
                    .smartlockId(defaultSmartlockId)
                    .name("bcube Studio Hauptbahnhof")
                    .description("Unser Flaggschiff-Studio direkt am Wiener Hauptbahnhof – bestens erreichbar mit allen öffentlichen Verkehrsmitteln. Auf über 80 m² stehen dir modernste Trainingsgeräte, ein Yoga-Bereich und eine Entspannungszone zur Verfügung. Buche flexibel per App und betritt das Studio rund um die Uhr mit deinem persönlichen Zugangscode.")
                    .street("Alfred-Adler-Straße 55").plz(1100).city("Wien").country("Österreich")
                    .latitude(48.1851).longitude(16.3795)
                    .image(render1)
                    .imageGalleryJson(galleryJson(render1, interior1, interior2, inside1, inside2))
                    .isActive(true).hourlyRateCents(1500).build();

            studioRepository.save(studio);
            System.out.println("✅ Studio erfolgreich erstellt.");
        } else {
            System.out.println("ℹ️ Studios bereits vorhanden – Initialisierung übersprungen.");
        }
    }

    private String galleryJson(byte[]... images) {
        JSONArray array = new JSONArray();
        for (byte[] img : images) {
            if (img != null && img.length > 0) {
                array.put(Base64.getEncoder().encodeToString(img));
            }
        }
        return array.toString();
    }

    private byte[] loadImage(String path) {
        try (var inputStream = getClass().getClassLoader().getResourceAsStream(path)) {
            if (inputStream == null) {
                throw new IOException("Resource not found: " + path);
            }
            return inputStream.readAllBytes();
        } catch (IOException e) {
            throw new RuntimeException("Bild konnte nicht geladen werden: " + path, e);
        }
    }
}
