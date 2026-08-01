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
import java.util.List;

@Component
public class StudioInitializer implements CommandLineRunner {

    @Autowired
    private StudioRepository studioRepository;

    @Value("${studio.default.smartlock-id}")
    private Long defaultSmartlockId;

    @Override
    public void run(String... args) throws Exception {
        if (studioRepository.count() == 0) {
            byte[] render1   = loadImage("logos/new_render_1.jpg");
            byte[] render2   = loadImage("logos/new_render_2.jpg");
            byte[] render3   = loadImage("logos/new_render_3.jpg");
            byte[] render3b  = loadImage("logos/new_render_3 (1).jpg");
            byte[] render4   = loadImage("logos/new_render_4.jpg");
            byte[] render5   = loadImage("logos/new_render_5.jpg");
            byte[] render6   = loadImage("logos/new_render_6.jpg");
            byte[] render7   = loadImage("logos/new_render_7.jpg");
            byte[] oldRender = loadImage("logos/old_render_3.jpeg");
            byte[] interior1 = loadImage("logos/interior_1.jpeg");
            byte[] interior2 = loadImage("logos/interior_2.jpg");
            byte[] inside1   = loadImage("logos/inside 1.png");
            byte[] inside2   = loadImage("logos/inside 2.png");

            List<Studio> studios = List.of(
                    Studio.builder()
                            .smartlockId(defaultSmartlockId)
                            .name("bcube Studio Hauptbahnhof")
                            .description("Unser Flaggschiff-Studio direkt am Wiener Hauptbahnhof – bestens erreichbar mit allen öffentlichen Verkehrsmitteln. Auf über 80 m² stehen dir modernste Trainingsgeräte, ein Yoga-Bereich und eine Entspannungszone zur Verfügung. Buche flexibel per App und betritt das Studio rund um die Uhr mit deinem persönlichen Zugangscode.")
                            .street("Alfred-Adler-Straße 55").plz(1100).city("Wien").country("Österreich")
                            .latitude(48.1851).longitude(16.3795)
                            .image(render1)
                            .imageGalleryJson(galleryJson(render1, interior1, interior2))
                            .isActive(true).build(),

                    Studio.builder()
                            .smartlockId(defaultSmartlockId)
                            .name("bcube Studio Donauinsel")
                            .description("Trainiere mit Blick auf die Donau in einer einzigartigen Atmosphäre. Unser Studio auf der Donauinsel verbindet entspannte Naturnähe mit professioneller Infrastruktur. Ideal für Morgenworkouts, Meditation und Achtsamkeitsübungen – direkt am Wasser, fernab vom Stadtlärm.")
                            .street("Donauinsel 1").plz(1020).city("Wien").country("Österreich")
                            .latitude(48.2163).longitude(16.3908)
                            .image(render2)
                            .imageGalleryJson(galleryJson(render2, inside1, inside2))
                            .isActive(true).build(),

                    Studio.builder()
                            .smartlockId(defaultSmartlockId)
                            .name("bcube Studio Mariahilf")
                            .description("Mitten auf der belebtesten Einkaufsstraße Wiens findest du unser Studio in Mariahilf. Nach dem Shopping direkt ins Training – oder einfach eine Auszeit im Herzen der Stadt. Das Studio bietet Platz für Kraft- und Ausdauertraining sowie einen ruhigen Stretching-Bereich.")
                            .street("Mariahilfer Straße 77").plz(1060).city("Wien").country("Österreich")
                            .latitude(48.2017).longitude(16.3583)
                            .image(render3)
                            .imageGalleryJson(galleryJson(render3, render3b, interior1))
                            .isActive(true).build(),

                    Studio.builder()
                            .smartlockId(defaultSmartlockId)
                            .name("bcube Studio Prater")
                            .description("Im grünen Herzen Wiens gelegen bietet unser Prater-Studio eine ganz besondere Trainingsumgebung. Natürliches Licht und das Ambiente des traditionsreichen Praters sorgen für einzigartige Motivation. Perfekt für Lauf- und Outdoortraining rund ums Studio sowie für intensive Innensessions.")
                            .street("Prater 7").plz(1020).city("Wien").country("Österreich")
                            .latitude(48.2139).longitude(16.4003)
                            .image(render4)
                            .imageGalleryJson(galleryJson(render4, oldRender, interior2))
                            .isActive(true).build(),

                    Studio.builder()
                            .smartlockId(defaultSmartlockId)
                            .name("bcube Studio Schönbrunn")
                            .description("Im noblen 13. Bezirk, unweit des Schlosses Schönbrunn, bietet unser Studio ein exklusives Trainingsambiente. Historischer Charme trifft auf moderne Fitnessausstattung. Ob Yoga, Pilates oder Functional Training – hier erlebst du Training auf höchstem Niveau in ruhiger Umgebung.")
                            .street("Schönbrunner Allee 1").plz(1120).city("Wien").country("Österreich")
                            .latitude(48.1848).longitude(16.3123)
                            .image(render5)
                            .imageGalleryJson(galleryJson(render5, interior1, inside2))
                            .isActive(true).build(),

                    Studio.builder()
                            .smartlockId(defaultSmartlockId)
                            .name("bcube Studio Floridsdorf")
                            .description("Im aufstrebenden 21. Bezirk bieten wir eines unserer größten Studios mit über 100 m² Fläche. Großzügige Räumlichkeiten für umfangreiche Trainingsprogramme, Gruppenworkouts und persönliche Sessions. Ideal für Nordwiens Fitness-Community – mit ausreichend Parkplätzen direkt vor der Tür.")
                            .street("Brünner Straße 72").plz(1210).city("Wien").country("Österreich")
                            .latitude(48.2566).longitude(16.4010)
                            .image(render6)
                            .imageGalleryJson(galleryJson(render6, inside1, interior2))
                            .isActive(true).build(),

                    Studio.builder()
                            .smartlockId(defaultSmartlockId)
                            .name("bcube Studio Naschmarkt")
                            .description("Direkt am legendären Naschmarkt – dem kulinarischen Mittelpunkt Wiens. Unser Studio im 6. Bezirk kombiniert urbane Energie mit professioneller Trainingsumgebung. Nach dem Workout den frischesten Markt Wiens erkunden – ein einzigartiges Wiener Erlebnis für Körper und Geist.")
                            .street("Linke Wienzeile 6").plz(1060).city("Wien").country("Österreich")
                            .latitude(48.1988).longitude(16.3638)
                            .image(render7)
                            .imageGalleryJson(galleryJson(render7, interior1, inside1))
                            .isActive(true).build(),

                    Studio.builder()
                            .smartlockId(defaultSmartlockId)
                            .name("bcube Studio Favoriten")
                            .description("In Wiens bevölkerungsreichstem und lebendigstem Bezirk findest du unser Favoriten-Studio. Zentral gelegen und rund um die Uhr zugänglich bietet es dir alles für ein effektives Training: von Cardio bis Kraftgeräten, von Stretching bis Meditation. Dein täglicher Rückzugsort im 10. Bezirk.")
                            .street("Favoritenstraße 212").plz(1100).city("Wien").country("Österreich")
                            .latitude(48.1633).longitude(16.3693)
                            .image(oldRender)
                            .imageGalleryJson(galleryJson(oldRender, render3b, interior2))
                            .isActive(true).build()
            );

            studioRepository.saveAll(studios);
            System.out.println("✅ " + studios.size() + " Studios erfolgreich erstellt.");
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
