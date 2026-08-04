import { Component, Input } from '@angular/core';
import { Studio } from '@models/studio.model';

@Component({
    selector: 'app-studio-gallery',
    imports: [],
    templateUrl: './studio-gallery.component.html',
    styleUrl: './studio-gallery.component.css'
})
export class StudioGalleryComponent {
  @Input() studio: Studio | null = null;

  overlayVisible = false;
  overlayImage: string | null = null;

  // Every studio is required to have exactly 5 real images (enforced at create/update time -
  // see studio-form.util.ts), so this is exactly what the admin uploaded, never padded with
  // generic stock photos to reach a target count.
  get galleryImages(): string[] {
    if (!this.studio) {
      return [];
    }

    const gallery = this.studio.imageGalleryBase64?.filter(Boolean) ?? [];
    if (gallery.length > 0) {
      return gallery.map(image => this.normalizeImage(image));
    }

    return this.studio.imageBase64 ? [this.normalizeImage(this.studio.imageBase64)] : [];
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
}
