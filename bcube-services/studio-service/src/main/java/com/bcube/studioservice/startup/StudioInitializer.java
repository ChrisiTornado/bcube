package com.bcube.studioservice.startup;

import com.bcube.studioservice.persistance.entity.Studio;
import com.bcube.studioservice.persistance.repository.StudioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.time.Instant;
import java.util.List;


@Component
public class StudioInitializer implements CommandLineRunner {
    @Autowired
    private StudioRepository studioRepository;

    @Override
    public void run(String... args) throws Exception {
        if (studioRepository.count() == 0) {
            List<Studio> studios = List.of(
                    Studio.builder()
                            .name("bcube Wien Hauptbahnhof")
                            .description("Mitten im pulsierenden Herzen Wiens, direkt am Hauptbahnhof. Ideal für schnelle Sessions zwischen Terminen – modernes Ambiente, perfekte Akustik und bequem per Öffi erreichbar.")
                            .street("Wiedner Gürtel 1").plz(1100).city("Wien").country("Österreich")
                            .latitude(48.1850).longitude(16.3763)
                            .image(loadImage("logos/new_render_1.jpg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("bcube Museumsquartier")
                            .description("Im kreativen Zentrum Wiens, eingebettet im MuseumsQuartier. Umgeben von Kunst und Kultur – der perfekte Ort für inspirierende Aufnahmen und kreative Projekte.")
                            .street("Museumsplatz 1").plz(1070).city("Wien").country("Österreich")
                            .latitude(48.2035).longitude(16.3577)
                            .image(loadImage("logos/new_render_2.jpg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("bcube Mariahilfer Straße")
                            .description("An Wiens beliebtester Einkaufsmeile gelegen. Großzügige Räumlichkeiten, erstklassige Ausstattung und eine zentrale Lage machen diesen Standort zum Liebling vieler Stammkunden.")
                            .street("Mariahilfer Straße 100").plz(1060).city("Wien").country("Österreich")
                            .latitude(48.1985).longitude(16.3529)
                            .image(loadImage("logos/new_render_3.jpg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("bcube Kärntner Straße")
                            .description("Exklusiver Standort in der Wiener Innenstadt, wenige Schritte vom Stephansdom. Höchste Ausstattungsqualität für professionelle Produktionen im Herzen der Weltkulturstadt Wien.")
                            .street("Kärntner Straße 38").plz(1010).city("Wien").country("Österreich")
                            .latitude(48.2036).longitude(16.3711)
                            .image(loadImage("logos/new_render_5.jpg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("bcube Graz Hauptplatz")
                            .description("Direkt am historischen Hauptplatz der steirischen Landeshauptstadt. Graz trifft Moderne – dieser Standort verbindet den Charme der Altstadt mit professioneller Studiotechnik.")
                            .street("Hauptplatz 1").plz(8010).city("Graz").country("Österreich")
                            .latitude(47.0707).longitude(15.4386)
                            .image(loadImage("logos/new_render_7.jpg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("bcube Graz Kärntner Straße")
                            .description("An der belebten Kärntner Straße in Graz, nahe dem Jakominiplatz. Schnell erreichbar aus allen Grazer Bezirken – der ideale Treffpunkt für Bands, Podcaster und Kreative.")
                            .street("Kärntner Straße 10").plz(8010).city("Graz").country("Österreich")
                            .latitude(47.0620).longitude(15.4427)
                            .image(loadImage("logos/old_render_3.jpeg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("bcube Salzburg Getreidegasse")
                            .description("In der berühmtesten Gasse Salzburgs, Mozarts Geburtsstadt. Geschichte trifft Innovation – professionelle Studioräume inmitten des UNESCO-Weltkulturerbes.")
                            .street("Getreidegasse 9").plz(5020).city("Salzburg").country("Österreich")
                            .latitude(47.7987).longitude(13.0465)
                            .image(loadImage("logos/interior_2.jpg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("bcube Zürich HB")
                            .description("Direkt am Zürcher Hauptbahnhof – dem meistfrequentierten Bahnhof der Schweiz. Für Pendler und Durchreisende optimal gelegen, mit top ausgestatteten Räumen und flexiblen Buchungszeiten.")
                            .street("Bahnhofplatz 15").plz(8001).city("Zürich").country("Schweiz")
                            .latitude(47.3779).longitude(8.5400)
                            .image(loadImage("logos/inside_1.jpg")).isActive(true).createdAt(Instant.now()).build()
            );

            studios.forEach(studio -> studio.setCreatedAt(Instant.now()));
            studioRepository.saveAll(studios);

            System.out.println("✅ " + studios.size() + " Studios erfolgreich erstellt.");

        } else {
            System.out.println("ℹ️ Studios bereits vorhanden – Initialisierung übersprungen.");
        }
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
