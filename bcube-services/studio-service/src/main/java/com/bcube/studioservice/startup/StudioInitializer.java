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
                            .name("École Polytechnique Fédérale de Lausanne (EPFL)")
                            .description("An der EPFL studieren technikbegeisterte Menschen aus aller Welt. Das Studium legt großen Wert auf Forschung, Innovation und Praxisnähe – von Robotik über Data Science bis hin zu Nachhaltigkeit und Energieeffizienz.")
                            .street("Route Cantonale").plz(1015).city("Lausanne").country("Schweiz")
                            .latitude(46.5191).longitude(6.5668)
                            .image(loadImage("logos/EPFL.jpg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("ETH Zürich")
                            .description("Die ETH Zürich zählt zu den besten technischen Universitäten weltweit. Studierende erwartet ein anspruchsvolles Studium mit Fokus auf Ingenieurwissenschaften, Informatik, Architektur und Naturwissenschaften – kombiniert mit modernster Forschung.")
                            .street("Rämistrasse 101").plz(8092).city("Zürich").country("Schweiz")
                            .latitude(47.3763).longitude(8.5476)
                            .image(loadImage("logos/ETH_Zuerich.jpg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("Fernfachhochschule Schweiz (FFHS)")
                            .description("Die FFHS bietet flexible Online-Studiengänge in Wirtschaft, Technik und Gesundheit. Ideal für Berufstätige, die ein akademisches Studium mit beruflicher Praxis verbinden wollen.")
                            .street("Piazza Cioccaro 7").plz(6900).city("Lugano").country("Schweiz")
                            .latitude(46.0059).longitude(8.9483)
                            .image(loadImage("logos/FFHS.jpg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("FH Burgenland – Campus Eisenstadt")
                            .description("An der FH Burgenland erwartet Studierende eine familiäre Atmosphäre mit praxisnaher Lehre. Besonders stark ist sie in den Bereichen Energie- und Umweltmanagement, International Business und Soziale Arbeit.")
                            .street("Campus 1").plz(7000).city("Eisenstadt").country("Österreich")
                            .latitude(47.8457).longitude(16.5232)
                            .image(loadImage("logos/FH_Burgenland.jpg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("FH Campus Wien")
                            .description("Die FH Campus Wien bietet Studiengänge von Technik bis Gesundheit und Soziales. Hier lernen Studierende praxisorientiert in enger Kooperation mit Unternehmen und öffentlichen Einrichtungen.")
                            .street("Favoritenstraße 226").plz(1100).city("Wien").country("Österreich")
                            .latitude(48.1615).longitude(16.3821)
                            .image(loadImage("logos/FH_Campus.jpg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("FH Joanneum Graz")
                            .description("Die FH Joanneum steht für angewandte Forschung und internationale Studienprogramme. In Graz und an weiteren Standorten wird praxisnah in den Bereichen Technik, Wirtschaft, Design und Gesundheit gelehrt.")
                            .street("Alte Poststraße 149").plz(8020).city("Graz").country("Österreich")
                            .latitude(47.0739).longitude(15.4220)
                            .image(loadImage("logos/FH_Joanneum.jpg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("FH Kärnten – Campus Villach")
                            .description("An der FH Kärnten erwartet Studierende eine familiäre Lernumgebung mit Fokus auf Technik, Wirtschaft, Gesundheit und Soziales. Internationale Mobilität und interdisziplinäres Lernen stehen im Vordergrund.")
                            .street("Europastraße 4").plz(9524).city("Villach").country("Österreich")
                            .latitude(46.6145).longitude(13.8504)
                            .image(loadImage("logos/FH_Kaernten.jpg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("FH Luzern")
                            .description("Die FH Luzern kombiniert Technik, Wirtschaft, Musik und Design unter einem Dach. Das Studium fördert Kreativität und unternehmerisches Denken – mitten im Herzen der Schweiz.")
                            .street("Werftestrasse 4").plz(6005).city("Luzern").country("Schweiz")
                            .latitude(47.0437).longitude(8.3103)
                            .image(loadImage("logos/FH_Luzern.jpg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("FH Oberösterreich – Campus Hagenberg")
                            .description("Die FH OÖ in Hagenberg gilt als IT-Schwerpunkt-Hochschule. Studierende entwickeln innovative Softwarelösungen, lernen künstliche Intelligenz und Cybersecurity praxisnah kennen.")
                            .street("Softwarepark 11").plz(4232).city("Hagenberg").country("Österreich")
                            .latitude(48.3684).longitude(14.5162)
                            .image(loadImage("logos/FH_OOE.jpg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("FH St. Pölten")
                            .description("Die FH St. Pölten bietet ein dynamisches Umfeld für Medien, IT, Soziales und Gesundheit. Hier entstehen innovative Projekte, die Technik, Kreativität und gesellschaftliche Verantwortung verbinden.")
                            .street("Matthias-Corvinus-Straße 15").plz(3100).city("St. Pölten").country("Österreich")
                            .latitude(48.1997).longitude(15.6230)
                            .image(loadImage("logos/FH_St_Poelten.jpg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("FH Technikum Wien")
                            .description("Die FH Technikum Wien ist Österreichs größte rein technische Fachhochschule. Hier wird Technik mit Wirtschaft, Digitalisierung und Nachhaltigkeit verknüpft – praxisnah und innovativ.")
                            .street("Höchstädtplatz 6").plz(1200).city("Wien").country("Österreich")
                            .latitude(48.2348).longitude(16.3773)
                            .image(loadImage("logos/FH_Technikum.jpg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("FHNW – Fachhochschule Nordwestschweiz")
                            .description("Die FHNW bietet ein vielfältiges Studienangebot von Life Sciences über Pädagogik bis Wirtschaft. Der Praxisbezug und die enge Zusammenarbeit mit Industriepartnern zeichnen sie aus.")
                            .street("Bahnhofstrasse 6").plz(5210).city("Windisch").country("Schweiz")
                            .latitude(47.4802).longitude(8.2115)
                            .image(loadImage("logos/FHNW.jpg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("FH Vorarlberg")
                            .description("Die FH Vorarlberg ist stark in Forschung und Entwicklung – insbesondere in den Bereichen Technik, Wirtschaft und Soziales. Sie legt großen Wert auf Nachhaltigkeit und regionale Zusammenarbeit.")
                            .street("Hochschulstraße 1").plz(6850).city("Dornbirn").country("Österreich")
                            .latitude(47.4128).longitude(9.7410)
                            .image(loadImage("logos/FHV_Vorarlberg.jpg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("Johannes Kepler Universität Linz (JKU)")
                            .description("Die JKU verbindet Technik, Wirtschaft und Recht mit einem modernen Campusleben. Hier treffen Innovation, Start-up-Kultur und akademische Exzellenz aufeinander.")
                            .street("Altenberger Straße 69").plz(4040).city("Linz").country("Österreich")
                            .latitude(48.3375).longitude(14.3198)
                            .image(loadImage("logos/JKU.jpg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("Medizinische Universität Wien")
                            .description("Als eine der renommiertesten Medizinuniversitäten Europas bildet die MedUni Wien Ärztinnen, Forscher und Gesundheitsprofis aus. Forschung und klinische Praxis sind eng verzahnt.")
                            .street("Spitalgasse 23").plz(1090).city("Wien").country("Österreich")
                            .latitude(48.2190).longitude(16.3459)
                            .image(loadImage("logos/Med_Uni_Wien.jpg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("Universität Basel")
                            .description("Die Universität Basel ist die älteste Hochschule der Schweiz. Sie steht für exzellente Lehre in Natur-, Sozial- und Geisteswissenschaften und ein starkes internationales Netzwerk.")
                            .street("Petersplatz 1").plz(4001).city("Basel").country("Schweiz")
                            .latitude(47.5590).longitude(7.5870)
                            .image(loadImage("logos/Uni_Basel.jpg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("Universität Bern")
                            .description("In Bern studiert man in einer Stadt voller Geschichte und Natur. Die Universität Bern verbindet Forschung mit gesellschaftlicher Verantwortung und fördert nachhaltige Innovationen.")
                            .street("Hochschulstrasse 4").plz(3012).city("Bern").country("Schweiz")
                            .latitude(46.9508).longitude(7.4386)
                            .image(loadImage("logos/Uni_Bern.jpg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("Universität Innsbruck")
                            .description("Die Universität Innsbruck liegt mitten in den Alpen und bietet einzigartige Studienbedingungen. Forschung, Internationalität und Naturverbundenheit prägen das Campusleben.")
                            .street("Innrain 52").plz(6020).city("Innsbruck").country("Österreich")
                            .latitude(47.2622).longitude(11.3940)
                            .image(loadImage("logos/Uni_Innsbruck.jpg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("Universität Klagenfurt")
                            .description("Die Universität Klagenfurt ist jung, innovativ und interdisziplinär. Studierende profitieren von einem modernen Campus, Digitalisierungsschwerpunkten und internationaler Ausrichtung.")
                            .street("Universitätsstraße 65-67").plz(9020).city("Klagenfurt").country("Österreich")
                            .latitude(46.6178).longitude(14.2633)
                            .image(loadImage("logos/Uni_Klagenfurt.jpg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("Montanuniversität Leoben")
                            .description("Die Montanuniversität Leoben ist Österreichs Rohstoff- und Energietechnik-Hochschule. Hier entstehen Lösungen für Nachhaltigkeit, Recycling und industrielle Innovation.")
                            .street("Franz-Josef-Straße 18").plz(8700).city("Leoben").country("Österreich")
                            .latitude(47.3841).longitude(15.0906)
                            .image(loadImage("logos/Uni_Leoben.jpg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("Universität Salzburg")
                            .description("Die Universität Salzburg verbindet Wissenschaft und Kultur. Inmitten der Altstadt lernen Studierende in kleinen Gruppen und profitieren von der Nähe zur Forschung.")
                            .street("Kapitelgasse 4-6").plz(5020).city("Salzburg").country("Österreich")
                            .latitude(47.7983).longitude(13.0465)
                            .image(loadImage("logos/Uni_Salzburg.jpg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("Università della Svizzera italiana (USI)")
                            .description("Die USI in Lugano vereint Mehrsprachigkeit, Innovation und interkulturelles Lernen. Besonders beliebt sind Studiengänge in Kommunikation, Architektur und Informatik.")
                            .street("Via Buffi 13").plz(6900).city("Lugano").country("Schweiz")
                            .latitude(46.0078).longitude(8.9554)
                            .image(loadImage("logos/Uni_Svizzera.jpg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("Universität Zürich (UZH)")
                            .description("Die Universität Zürich ist die größte der Schweiz. Sie bietet ein breites Studienangebot – von Medizin und Recht bis zu Kunstgeschichte – und ist international stark vernetzt.")
                            .street("Rämistrasse 71").plz(8006).city("Zürich").country("Schweiz")
                            .latitude(47.3769).longitude(8.5481)
                            .image(loadImage("logos/UZH.jpg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("Wirtschaftsuniversität Wien (WU)")
                            .description("Die WU Wien ist Europas größte Business-Universität. Studierende lernen hier internationale Betriebswirtschaft, Management und Nachhaltigkeit – auf einem der modernsten Campus Europas.")
                            .street("Welthandelsplatz 1").plz(1020).city("Wien").country("Österreich")
                            .latitude(48.2132).longitude(16.4110)
                            .image(loadImage("logos/WU.jpg")).isActive(true).createdAt(Instant.now()).build(),

                    Studio.builder()
                            .name("Zürcher Hochschule der Künste (ZHdK)")
                            .description("Die ZHdK ist eine der größten Kunsthochschulen Europas. Sie vereint Musik, Design, Theater, Film und Kunst in einem kreativen Lernumfeld im modernen Toni-Areal Zürich.")
                            .street("Pfingstweidstrasse 96").plz(8005).city("Zürich").country("Schweiz")
                            .latitude(47.3900).longitude(8.5157)
                            .image(loadImage("logos/ZHDK.jpg")).isActive(true).createdAt(Instant.now()).build()
            );

            studios.forEach(studio -> studio.setCreatedAt(Instant.now()));
            studioRepository.saveAll(studios);

            System.out.println("✅ " + studios.size() + " Hochschulen erfolgreich erstellt.");
        } else {
            System.out.println("ℹ️ Studios bereits vorhanden – Initialisierung übersprungen.");
        }
    }

    private byte[] loadImage(String path) {
        try {
            return Files.readAllBytes(new ClassPathResource(path).getFile().toPath());
        } catch (IOException e) {
            System.err.println("⚠️ Konnte Bild nicht laden: " + path + " → " + e.getMessage());
            return null;
        }
    }
}
