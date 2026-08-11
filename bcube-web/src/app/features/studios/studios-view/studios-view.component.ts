import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
  ChangeDetectionStrategy
} from '@angular/core';

import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';

import { StudioService } from '@features/studios/studio.service';
import { Studio } from '@models/studio.model';
import { LoadingSpinnerComponent } from '@shared/ui/loading-spinner/loading-spinner.component';
import { AuthService } from '@core/services/auth.service';
import { CreateStudioComponent } from '@features/studios/create-studio/create-studio.component';
import { UpdateStudioComponent } from '@features/studios/studios-view/update-studio/update-studio.component';
import { DeleteStudioComponent } from '@features/studios/studios-view/delete-studio/delete-studio.component';
import { StudioMapComponent } from '@features/studios/studios-view/studio-map/studio-map.component';
import { environment } from '@environments/environment';
import { getDashboardBasePath } from '@shared/util/dashboard-path.util';

type StudioViewModel = Studio & { gallery: string[] };

@Component({
    selector: 'app-studios-view',
    imports: [
    ButtonModule,
    LoadingSpinnerComponent,
    CreateStudioComponent,
    UpdateStudioComponent,
    DeleteStudioComponent,
    StudioMapComponent
],
    templateUrl: './studios-view.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './studios-view.component.css'
})
export class StudiosViewComponent implements OnInit, AfterViewInit, OnDestroy {
  studios: StudioViewModel[] = [];
  selectedStudio: StudioViewModel | null = null;
  isAdmin = false;
  readonly pageSize = 8;
  totalStudios = 0;
  currentPage = 0;
  loadingMore = false;
  isInitialLoading = true;
  mapPreviewImageIndex = 0;
  placeholderImageIndex = 0;

  readonly previewImages = [
    'assets/images/inside 1.png',
    'assets/images/interior_2.jpg',
    'assets/images/new_render_3.jpg',
    'assets/images/new_render_6.jpg',
    'assets/images/new_render_7.jpg',
    'assets/images/nice.jpg'
  ];

  private readonly destroy$ = new Subject<void>();
  private readonly studioImageCache = new Map<string | number, string>();
  private readonly studioGalleryIndices = new Map<number, number>();

  @ViewChildren('studioCard', { read: ElementRef })
  private studioCards!: QueryList<ElementRef<HTMLElement>>;
  @ViewChild(StudioMapComponent)
  private studioMap?: StudioMapComponent;

  constructor(
    public studioService: StudioService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.loadStudiosPage(0, false);
  }

  ngAfterViewInit(): void {
    this.studioMap?.ensureMapInitialized();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Wird ausgelöst, sobald die Mapbox-Karte vollständig geladen ist */
  handleMapReady(): void {
    this.studioMap?.renderMarkers(this.studios, this.selectedStudio?.id ?? null);
    this.studioMap?.fitToStudios(this.studios);
    this.studioMap?.updateMarkerStyles(this.selectedStudio?.id ?? null);
  }

  /** Wird ausgelöst, wenn ein Marker auf der Karte angeklickt wird */
  handleMarkerSelected(studioId: number): void {
    const studio = this.studios.find(s => s.id === studioId);
    if (studio) {
      this.selectStudio(studio, true, true);
    }
  }

  navigateToDetails(studio: StudioViewModel): void {
    const basePath = getDashboardBasePath(this.isAdmin);
    const navigationUrl = [basePath, 'studio-details', studio.id];

    this.router.navigate(navigationUrl, {
      state: { returnUrl: this.router.url }
    });
  }

  selectStudio(studio: StudioViewModel, centerMap: boolean = true, scrollCard: boolean = false): void {
    if (this.selectedStudio?.id !== studio.id) {
      this.mapPreviewImageIndex = 0;
    }

    this.selectedStudio = studio;
    this.studioMap?.updateMarkerStyles(studio.id);

    if (centerMap) {
      this.studioMap?.focusOnStudio(studio);
    }

    if (scrollCard) {
      this.scrollCardIntoView(studio.id);
    }
  }

  clearSelection(): void {
    this.selectedStudio = null;
    this.mapPreviewImageIndex = 0;
    this.studioMap?.updateMarkerStyles(null);
    this.studioMap?.fitToStudios(this.studios);
  }

  loadMoreStudios(): void {
    if (!this.canLoadMore || this.loadingMore) {
      return;
    }

    this.loadingMore = true;
    this.loadStudiosPage(this.currentPage + 1, true);
  }

  get canLoadMore(): boolean {
    return this.studios.length < this.totalStudios;
  }

  trackByStudioId(_: number, studio: StudioViewModel): number {
    return studio.id;
  }

  trackByImage(index: number): number {
    return index;
  }

  openDirections(studio: StudioViewModel, event: Event): void {
    event.stopPropagation();

    if (studio.latitude == null || studio.longitude == null) {
      return;
    }

    globalThis.open(
      `https://www.google.com/maps/dir/?api=1&destination=${studio.latitude},${studio.longitude}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  getStudioTranslate(studio: StudioViewModel): string {
    return `translate3d(-${this.getStudioImageIndex(studio) * 100}%, 0, 0)`;
  }

  getMapPreviewTranslate(studio: StudioViewModel): string {
    return `translate3d(-${this.getMapPreviewImageIndex(studio) * 100}%, 0, 0)`;
  }

  getStudioImageIndex(studio: StudioViewModel): number {
    const gallery = studio.gallery;
    const currentIndex = this.studioGalleryIndices.get(studio.id) ?? 0;

    if (gallery.length === 0) {
      return 0;
    }

    return Math.max(0, Math.min(currentIndex, gallery.length - 1));
  }

  getMapPreviewImageIndex(studio: StudioViewModel): number {
    const gallery = studio.gallery;

    if (gallery.length === 0) {
      return 0;
    }

    return Math.max(0, Math.min(this.mapPreviewImageIndex, gallery.length - 1));
  }

  showPreviousStudioImage(studio: StudioViewModel, event: Event): void {
    event.stopPropagation();

    const gallery = studio.gallery;
    if (gallery.length < 2) {
      return;
    }

    const currentIndex = this.getStudioImageIndex(studio);
    const nextIndex = (currentIndex - 1 + gallery.length) % gallery.length;
    this.studioGalleryIndices.set(studio.id, nextIndex);
  }

  showNextStudioImage(studio: StudioViewModel, event: Event): void {
    event.stopPropagation();

    const gallery = studio.gallery;
    if (gallery.length < 2) {
      return;
    }

    const currentIndex = this.getStudioImageIndex(studio);
    const nextIndex = (currentIndex + 1) % gallery.length;
    this.studioGalleryIndices.set(studio.id, nextIndex);
  }

  getPlaceholderTranslate(): string {
    return `translate3d(-${this.placeholderImageIndex * 100}%, 0, 0)`;
  }

  showPreviousPlaceholderImage(event: Event): void {
    event.stopPropagation();
    this.placeholderImageIndex = (this.placeholderImageIndex - 1 + this.previewImages.length) % this.previewImages.length;
  }

  showNextPlaceholderImage(event: Event): void {
    event.stopPropagation();
    this.placeholderImageIndex = (this.placeholderImageIndex + 1) % this.previewImages.length;
  }

  showPreviousMapPreviewImage(studio: StudioViewModel, event: Event): void {
    event.stopPropagation();

    const gallery = studio.gallery;
    if (gallery.length < 2) {
      return;
    }

    const currentIndex = this.getMapPreviewImageIndex(studio);
    this.mapPreviewImageIndex = (currentIndex - 1 + gallery.length) % gallery.length;
  }

  showNextMapPreviewImage(studio: StudioViewModel, event: Event): void {
    event.stopPropagation();

    const gallery = studio.gallery;
    if (gallery.length < 2) {
      return;
    }

    const currentIndex = this.getMapPreviewImageIndex(studio);
    this.mapPreviewImageIndex = (currentIndex + 1) % gallery.length;
  }

  handleStudioImageError(event: Event, studio: StudioViewModel): void {
    const image = event.target as HTMLImageElement | null;

    if (!image) {
      return;
    }

    image.src = this.previewImages[studio.id % this.previewImages.length];
    this.studioImageCache.set(studio.id, image.src);
  }

  getStudioTeaser(studio: StudioViewModel, maxLength: number = 88): string {
    const description = studio.description?.trim();

    if (!description) {
      return 'Flexible Sessions, kompakte Production-Setups und ein direkter Start ohne Umwege.';
    }

    if (description.length <= maxLength) {
      return description;
    }

    return `${description.slice(0, maxLength).trim()}...`;
  }

  private loadStudiosPage(page: number, append: boolean): void {
    this.studioService
      .getStudiosPagination(page, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          const pageStudios = response.content.map(studio => this.toStudioViewModel(studio));

          this.totalStudios = response.totalElements ?? pageStudios.length;
          this.currentPage = page;
          this.studios = append ? [...this.studios, ...pageStudios] : pageStudios;
          this.loadingMore = false;
          this.isInitialLoading = false;
          this.studioService.setStudios(this.studios);

          if (this.selectedStudio) {
            this.selectedStudio =
              this.studios.find(studio => studio.id === this.selectedStudio?.id) ??
              null;
          }

          if (this.studioMap?.isMapLoaded()) {
            this.studioMap.renderMarkers(this.studios, this.selectedStudio?.id ?? null);
            if (page === 0 && !append) {
              this.studioMap.fitToStudios(this.studios);
            }
            this.studioMap.updateMarkerStyles(this.selectedStudio?.id ?? null);
            this.studioMap.resize();
          }
        },
        error: err => {
          if (!environment.production) {
            console.error('Fehler beim Laden der Studios', err);
          }
          this.isInitialLoading = false;
          this.loadingMore = false;

          if (!append) {
            this.studios = [];
            this.totalStudios = 0;
            this.selectedStudio = null;
          }
        }
      });
  }

  private scrollCardIntoView(studioId: number): void {
    setTimeout(() => {
      const card = this.studioCards.find(
        entry => entry.nativeElement.dataset['studioId'] === String(studioId)
      );

      card?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    });
  }

  private toStudioViewModel(studio: Studio): StudioViewModel {
    return {
      ...studio,
      gallery: this.buildGallery(studio)
    };
  }

  // Every studio is required to have exactly STUDIO_IMAGE_COUNT real images (enforced at
  // create/update time - see studio-form.util.ts), so the gallery is exactly what the admin
  // uploaded, never padded with generic stock photos to reach a target count.
  private buildGallery(studio: Studio): string[] {
    const gallery = (studio.imageGalleryBase64?.filter(Boolean) ?? []).map(image =>
      this.resolveStudioImage(studio.id, image)
    );

    if (gallery.length > 0) {
      return gallery;
    }

    const value = studio.imageBase64?.trim();
    return value ? [this.resolveStudioImage(studio.id, value)] : [];
  }

  private resolveStudioImage(studioId: number, value: string): string {
    const cacheKey = `${studioId}:${value}`;
    const cachedImage = this.studioImageCache.get(cacheKey);

    if (cachedImage) {
      return cachedImage;
    }

    const resolvedImage = value.startsWith('data:image') ? value : this.toDataImage(value);
    this.studioImageCache.set(cacheKey, resolvedImage);
    return resolvedImage;
  }

  private toDataImage(value: string): string {
    if (value.startsWith('data:image')) {
      return value;
    }

    const normalized = value.replace(/\s+/g, '');
    const mimeType = this.detectMimeType(normalized);

    return `data:${mimeType};base64,${normalized}`;
  }

  private detectMimeType(base64: string): string {
    if (base64.startsWith('/9j/')) {
      return 'image/jpeg';
    }

    if (base64.startsWith('iVBOR')) {
      return 'image/png';
    }

    if (base64.startsWith('R0lGOD')) {
      return 'image/gif';
    }

    if (base64.startsWith('UklGR')) {
      return 'image/webp';
    }

    return 'image/jpeg';
  }
}
