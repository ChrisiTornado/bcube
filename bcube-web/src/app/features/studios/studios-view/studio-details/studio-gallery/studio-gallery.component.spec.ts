import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudioGalleryComponent } from './studio-gallery.component';
import { Studio } from '@models/studio.model';

describe('StudioGalleryComponent', () => {
  let component: StudioGalleryComponent;
  let fixture: ComponentFixture<StudioGalleryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudioGalleryComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(StudioGalleryComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('galleryImages', () => {
    it('returns an empty gallery when there is no studio', () => {
      component.studio = null;
      expect(component.galleryImages).toEqual([]);
    });

    it('pads the studio gallery up to 5 images with fallback previews', () => {
      component.studio = { id: 1, imageGalleryBase64: ['abc123'] } as Studio;

      const images = component.galleryImages;
      expect(images.length).toBe(5);
      expect(images[0]).toBe('data:image/jpeg;base64,abc123');
    });

    it('does not double-prefix an already data-URI-formatted image', () => {
      component.studio = { id: 1, imageGalleryBase64: ['data:image/png;base64,abc123'] } as Studio;
      expect(component.galleryImages[0]).toBe('data:image/png;base64,abc123');
    });

    it('falls back to imageBase64 when imageGalleryBase64 is empty', () => {
      component.studio = { id: 1, imageGalleryBase64: [] as string[], imageBase64: 'solo123' } as Studio;
      expect(component.galleryImages[0]).toBe('data:image/jpeg;base64,solo123');
    });

    it('truncates to at most 5 images when the studio already has enough', () => {
      component.studio = {
        id: 1,
        imageGalleryBase64: ['a', 'b', 'c', 'd', 'e', 'f']
      } as Studio;

      expect(component.galleryImages.length).toBe(5);
    });
  });

  describe('featuredGalleryImage / secondaryGalleryImages', () => {
    it('splits the gallery into a featured first image and up to 4 secondary images', () => {
      component.studio = { id: 1, imageGalleryBase64: ['a', 'b', 'c'] } as Studio;

      expect(component.featuredGalleryImage).toBe(component.galleryImages[0]);
      expect(component.secondaryGalleryImages).toEqual(component.galleryImages.slice(1, 5));
      expect(component.secondaryGalleryImages.length).toBe(4);
    });
  });

  describe('overlay', () => {
    it('showOverlay sets the image and makes the overlay visible', () => {
      component.showOverlay('data:image/png;base64,xyz');

      expect(component.overlayVisible).toBeTrue();
      expect(component.overlayImage).toBe('data:image/png;base64,xyz');
    });

    it('hideOverlay clears the image and hides the overlay', () => {
      component.showOverlay('data:image/png;base64,xyz');
      component.hideOverlay();

      expect(component.overlayVisible).toBeFalse();
      expect(component.overlayImage).toBeNull();
    });
  });
});
