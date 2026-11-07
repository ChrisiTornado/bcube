package com.bcube.studioservice;

import com.bcube.studioservice.persistance.entity.Studio;
import com.bcube.studioservice.persistance.entity.StudioImage;
import com.bcube.studioservice.persistance.repository.StudioRepository;
import com.bcube.studioservice.service.impl.StudioImageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
class StudioImageServiceTest {

    @Autowired
    private StudioImageService service;
    @Autowired
    private StudioRepository studios;

    private long studioId;

    @BeforeEach
    void createStudio() {
        Studio studio = studios.save(Studio.builder()
                .smartlockId(1L).name("Test").description("Beschreibung").street("Strasse 1")
                .plz(1010).city("Wien").country("Österreich").isActive(true).hourlyRateCents(1000).build());
        studioId = studio.getId();
    }

    @Test
    void largeUploadIsScaledToDisplayAndThumbnailSize() throws Exception {
        service.replaceImages(studioId, List.of(png(3200, 2000)));

        StudioImage image = service.imagesOf(studioId).get(0);
        assertThat(dimensions(image.getFullData())).isEqualTo(new int[]{1600, 1000});
        assertThat(dimensions(image.getThumbData())).isEqualTo(new int[]{480, 300});
        assertThat(image.getContentType()).isEqualTo("image/jpeg");
        assertThat(image.getFullData().length).isLessThan(png(3200, 2000).length);
    }

    @Test
    void smallImageIsNeverUpscaled() throws Exception {
        service.replaceImages(studioId, List.of(png(300, 200)));

        StudioImage image = service.imagesOf(studioId).get(0);
        assertThat(dimensions(image.getFullData())).isEqualTo(new int[]{300, 200});
        assertThat(dimensions(image.getThumbData())).isEqualTo(new int[]{300, 200});
    }

    @Test
    void imagesKeepTheOrderTheyWereSentIn() throws Exception {
        service.replaceImages(studioId, List.of(png(1000, 500), png(500, 1000), png(800, 800)));

        List<StudioImage> images = service.imagesOf(studioId);
        assertThat(images).extracting(StudioImage::getPosition).containsExactly(0, 1, 2);
        assertThat(dimensions(images.get(0).getFullData())).isEqualTo(new int[]{1000, 500});
        assertThat(dimensions(images.get(1).getFullData())).isEqualTo(new int[]{500, 1000});
    }

    @Test
    void sendingBackTheThumbnailKeepsTheStoredFullImage() throws Exception {
        service.replaceImages(studioId, List.of(png(3200, 2000), png(2400, 1600)));
        List<StudioImage> before = service.imagesOf(studioId);

        // What a client holds after loading a list: the thumbnails. Sending them back on update
        // must not replace the stored display-size images with these smaller copies.
        service.replaceImages(studioId, List.of(before.get(0).getThumbData(), before.get(1).getThumbData()));

        List<StudioImage> after = service.imagesOf(studioId);
        assertThat(after).hasSize(2);
        assertThat(after.get(0).getFullData()).isEqualTo(before.get(0).getFullData());
        assertThat(after.get(1).getFullData()).isEqualTo(before.get(1).getFullData());
        assertThat(after.get(0).getEtag()).isEqualTo(before.get(0).getEtag());
    }

    @Test
    void replacingOneImageLeavesTheOthersUntouched() throws Exception {
        service.replaceImages(studioId, List.of(png(1200, 800), png(900, 600)));
        List<StudioImage> before = service.imagesOf(studioId);

        service.replaceImages(studioId, List.of(png(700, 700), before.get(1).getFullData()));

        List<StudioImage> after = service.imagesOf(studioId);
        assertThat(after.get(0).getEtag()).isNotEqualTo(before.get(0).getEtag());
        assertThat(after.get(1).getEtag()).isEqualTo(before.get(1).getEtag());
    }

    @Test
    void anUnreadableUploadIsRejectedAndLeavesTheGalleryAlone() throws Exception {
        service.replaceImages(studioId, List.of(png(800, 600)));
        String etag = service.imagesOf(studioId).get(0).getEtag();

        assertThatThrownBy(() -> service.replaceImages(studioId, List.of("not an image".getBytes())))
                .isInstanceOf(IllegalArgumentException.class);

        assertThat(service.imagesOf(studioId)).hasSize(1);
        assertThat(service.imagesOf(studioId).get(0).getEtag()).isEqualTo(etag);
    }

    private static byte[] png(int width, int height) throws Exception {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        for (int x = 0; x < width; x += 7) {
            for (int y = 0; y < height; y += 7) {
                image.setRGB(x, y, (x * 31 + y * 17) & 0xFFFFFF);
            }
        }
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        return out.toByteArray();
    }

    private static int[] dimensions(byte[] jpeg) throws Exception {
        BufferedImage image = ImageIO.read(new ByteArrayInputStream(jpeg));
        return new int[]{image.getWidth(), image.getHeight()};
    }
}
