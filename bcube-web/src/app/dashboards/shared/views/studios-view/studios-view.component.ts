import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import * as mapboxgl from 'mapbox-gl';
import { Subject, takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';

import { environment } from '../../../../../environments/environment.local';
import { StudioService } from '../../../../services/studio.service';
import { Studio } from '../../../../models/Studio';
import { LoadingSpinnerComponent } from '../../../../shared/loading-spinner/loading-spinner.component';
import { AuthService } from '../../../../services/auth/auth.service';
import { StudiosComponent } from '../../components/studios/studios.component';
import { UpdateStudioComponent } from './update-studio/update-studio.component';
import { DeleteStudioComponent } from './delete-studio/delete-studio.component';

type StudioViewModel = Studio & { gallery: string[] };

@Component({
  selector: 'app-studios-view',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    LoadingSpinnerComponent,
    StudiosComponent,
    UpdateStudioComponent,
    DeleteStudioComponent
  ],
  templateUrl: './studios-view.component.html',
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

  readonly previewImages = [
    'assets/images/inside 1.png',
    'assets/images/interior_2.jpg',
    'assets/images/new_render_3.jpg',
    'assets/images/new_render_6.jpg',
    'assets/images/new_render_7.jpg',
    'assets/images/nice.jpg'
  ];

  private readonly destroy$ = new Subject<void>();
  private readonly defaultCenter: [number, number] = [16.3738, 48.2082];
  private readonly studioImageCache = new Map<string | number, string>();
  private readonly studioGalleryIndices = new Map<number, number>();
  private map: mapboxgl.Map | null = null;
  private mapLoaded = false;
  private markers: Array<{
    studioId: number;
    marker: mapboxgl.Marker;
    element: HTMLElement;
  }> = [];

  @ViewChildren('studioCard', { read: ElementRef })
  private studioCards!: QueryList<ElementRef<HTMLElement>>;
  @ViewChild('resultsPanel', { read: ElementRef })
  private resultsPanel?: ElementRef<HTMLElement>;
  @ViewChild('mapSurface', { read: ElementRef })
  private mapSurface?: ElementRef<HTMLDivElement>;

  constructor(
    public studioService: StudioService,
    private router: Router,
    private authService: AuthService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.getRole() === 'ADMIN';
    this.loadStudiosPage(0, false);
  }

  ngAfterViewInit(): void {
    this.ensureMapInitialized();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearMarkerLayers();
    this.map?.remove();
    this.map = null;
  }

  navigateToDetails(studio: StudioViewModel): void {
    const basePath = this.isAdmin ? '/admin-dashboard' : '/user-dashboard';
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
    this.ensureStudioVisibleInResults(studio.id);
    this.updateMarkerStyles();

    if (centerMap) {
      this.focusMapOnStudio(studio);
    }

    if (scrollCard) {
      this.scrollCardIntoView(studio.id);
    }
  }

  clearSelection(): void {
    this.selectedStudio = null;
    this.mapPreviewImageIndex = 0;
    this.updateMarkerStyles();
    this.fitMapToStudios();
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

  private ensureMapInitialized(): void {
    if (!this.mapSurface || this.map) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.initMap(this.mapSurface!.nativeElement);
    });
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

          if (this.mapLoaded) {
            this.renderMarkers();
            if (page === 0 && !append) {
              this.fitMapToStudios();
            }
            this.updateMarkerStyles();
            this.map?.resize();
          }
        },
        error: err => {
          console.error('Fehler beim Laden der Studios', err);
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

  private initMap(container: HTMLDivElement): void {
    this.map = new mapboxgl.Map({
      container,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: this.defaultCenter,
      zoom: 10.4,
      minZoom: 7.6,
      maxZoom: 15.2,
      accessToken: environment.token,
      attributionControl: false
    });

    this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    this.map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');
    this.map.scrollZoom.enable();

    this.map.on('click', () => {
      this.ngZone.run(() => {
        this.clearSelection();
      });
    });

    this.map.on('load', () => {
      this.mapLoaded = true;
      this.map?.resize();
      this.renderMarkers();
      this.fitMapToStudios();
      this.updateMarkerStyles();
    });
  }

  private renderMarkers(): void {
    const map = this.map;

    if (!this.mapLoaded || !map) {
      return;
    }

    this.clearMarkerLayers();

    this.studios.forEach(studio => {
      if (studio.latitude == null || studio.longitude == null) {
        return;
      }

      const marker = new mapboxgl.Marker({
        color: '#111111',
        scale: 1.15
      })
        .setLngLat([studio.longitude, studio.latitude])
        .addTo(map);

      const element = marker.getElement();
      element.style.cursor = 'pointer';

      element.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();

        this.ngZone.run(() => {
          this.selectStudio(studio, true, true);
        });
      });

      this.markers.push({
        studioId: studio.id,
        marker,
        element
      });
    });

    this.updateMarkerStyles();
  }

  private focusMapOnStudio(studio: StudioViewModel): void {
    if (!this.map || studio.latitude == null || studio.longitude == null) {
      return;
    }

    this.map.flyTo({
      center: [studio.longitude, studio.latitude],
      zoom: 13.6,
      essential: true,
      duration: 900
    });
  }

  private fitMapToStudios(): void {
    if (!this.map) {
      return;
    }

    const locatedStudios = this.studios.filter(
      studio => studio.latitude != null && studio.longitude != null
    );

    if (locatedStudios.length === 0) {
      this.map.flyTo({
        center: this.defaultCenter,
        zoom: 10.4,
        essential: true,
        duration: 950
      });
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();
    locatedStudios.forEach(studio => {
      bounds.extend([studio.longitude as number, studio.latitude as number]);
    });

    this.map.fitBounds(bounds, {
      padding: { top: 72, right: 72, bottom: 104, left: 72 },
      maxZoom: 12.1,
      duration: 950,
      essential: true
    });
  }

  private updateMarkerStyles(): void {
    this.markers.forEach(({ studioId, marker, element }) => {
      const isSelected = studioId === this.selectedStudio?.id;
      marker.setOffset(isSelected ? [0, -6] : [0, 0]);
      element.style.filter = isSelected
        ? 'drop-shadow(0 0 0 3px rgba(255,255,255,0.96)) drop-shadow(0 12px 24px rgba(0,0,0,0.24))'
        : 'drop-shadow(0 10px 18px rgba(0,0,0,0.16))';
    });
  }

  private clearMarkerLayers(): void {
    this.markers.forEach(({ marker }) => marker.remove());
    this.markers = [];
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

  private ensureStudioVisibleInResults(studioId: number): void {
    return;
  }

  private toStudioViewModel(studio: Studio): StudioViewModel {
    return {
      ...studio,
      gallery: this.buildGallery(studio)
    };
  }

  private buildGallery(studio: Studio): string[] {
    const gallery = (studio.imageGalleryBase64?.filter(Boolean) ?? []).map(image =>
      this.resolveStudioImage(studio.id, image)
    );

    if (gallery.length > 0) {
      return this.withDefaultGallery(studio.id, gallery);
    }

    const value = studio.imageBase64?.trim();
    if (value) {
      return this.withDefaultGallery(studio.id, [this.resolveStudioImage(studio.id, value)]);
    }

    return this.withDefaultGallery(studio.id, []);
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

  private withDefaultGallery(studioId: number, images: string[]): string[] {
    const gallery = [...images];

    for (let offset = 0; gallery.length < 5; offset++) {
      gallery.push(this.previewImages[(studioId + offset) % this.previewImages.length]);
    }

    return gallery.slice(0, 5);
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
