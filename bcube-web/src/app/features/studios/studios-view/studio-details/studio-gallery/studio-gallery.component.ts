import { Component, Input } from '@angular/core';
import { Studio } from '@models/studio.model';

@Component({
    selector: 'app-studio-gallery',
    imports: [],
    templateUrl: './studio-gallery.component.html',
    styleUrl: './studio-gallery.component.css'
})
export class StudioGalleryComponent {
  private readonly previewImages = [
    'assets/images/inside 1.png',
    'assets/images/interior_2.jpg',
    'assets/images/new_render_3.jpg',
    'assets/images/new_render_6.jpg',
    'assets/images/new_render_7.jpg',
    'assets/images/nice.jpg'
  ];

  @Input() studio: Studio | null = null;

  overlayVisible = false;
  overlayImage: string | null = null;

  get galleryImages(): string[] {
    if (!this.studio) {
      return [];
    }

    const gallery = this.studio.imageGalleryBase64?.filter(Boolean) ?? [];
    if (gallery.length > 0) {
      return this.withDefaultGallery(this.studio.id, gallery.map(image => this.normalizeImage(image)));
    }

    if (this.studio.imageBase64) {
      return this.withDefaultGallery(this.studio.id, [this.normalizeImage(this.studio.imageBase64)]);
    }

    return this.withDefaultGallery(this.studio.id, []);
  }

  get featuredGalleryImage(): string | null {
    return this.galleryImages[0] ?? null;
  }

  get secondaryGalleryImages(): string[] {
    return this.galleryImages.slice(1, 5);
  }

  showOverlay(image: string): void {
    this.overlayImage = image;
    this.overlayVisible = true;
  }

  hideOverlay(): void {
    this.overlayVisible = false;
    this.overlayImage = null;
  }

  private normalizeImage(value: string): string {
    return value.startsWith('data:image') ? value : `data:image/jpeg;base64,${value}`;
  }

  private withDefaultGallery(studioId: number, images: string[]): string[] {
    const gallery = [...images];

    for (let offset = 0; gallery.length < 5; offset++) {
      gallery.push(this.previewImages[(studioId + offset) % this.previewImages.length]);
    }

    return gallery.slice(0, 5);
  }
}
