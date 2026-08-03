import { Component, ElementRef, EventEmitter, NgZone, OnDestroy, Output, ViewChild } from '@angular/core';
import type * as MapboxGl from 'mapbox-gl';
import { environment } from '@environments/environment';
import { Studio } from '@models/studio.model';

@Component({
    selector: 'app-studio-map',
    imports: [],
    templateUrl: './studio-map.component.html',
    styleUrl: './studio-map.component.css'
})
export class StudioMapComponent implements OnDestroy {
  @Output() studioSelected = new EventEmitter<number>();
  @Output() mapCleared = new EventEmitter<void>();
  @Output() mapReady = new EventEmitter<void>();

  private readonly defaultCenter: [number, number] = [16.3738, 48.2082];
  // mapbox-gl is loaded via dynamic import() so it lands in its own chunk instead of
  // bloating the studios-view bundle with a library most visits never render on-screen.
  private mapboxgl: typeof MapboxGl | null = null;
  private map: MapboxGl.Map | null = null;
  private mapLoaded = false;
  // Angular's CSS Grid layout can still be settling the container's final size at the exact
  // moment the map is constructed, leaving mapbox-gl's internal transform stuck at a stale
  // size - it then never requests a repaint for the actual viewport, so the map renders
  // nothing (grey) even though tiles load fine in the background. Watching the container
  // and calling resize() on every real size change is the standard fix for this class of bug.
  private resizeObserver: ResizeObserver | null = null;
  private markers: Array<{
    studioId: number;
    marker: MapboxGl.Marker;
    element: HTMLElement;
  }> = [];

  @ViewChild('mapSurface', { read: ElementRef })
  private mapSurface?: ElementRef<HTMLDivElement>;

  constructor(private ngZone: NgZone) {}

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.clearMarkerLayers();
    this.map?.remove();
    this.map = null;
  }

  ensureMapInitialized(): void {
    if (!this.mapSurface || this.map) {
      return;
    }

    const surface = this.mapSurface.nativeElement;
    import('mapbox-gl').then(module => {
      // Guard against the component being destroyed while the chunk was loading.
      if (!this.mapSurface) {
        return;
      }
      this.mapboxgl = module;
      this.ngZone.runOutsideAngular(() => {
        this.initMap(surface);
      });
    });
  }

  isMapLoaded(): boolean {
    return this.mapLoaded;
  }

  resize(): void {
    this.map?.resize();
  }

  renderMarkers(studios: Studio[], selectedStudioId: number | null): void {
    const map = this.map;
    const mapboxgl = this.mapboxgl;

    if (!this.mapLoaded || !map || !mapboxgl) {
      return;
    }

    this.clearMarkerLayers();

    studios.forEach(studio => {
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
          this.studioSelected.emit(studio.id);
        });
      });

      this.markers.push({
        studioId: studio.id,
        marker,
        element
      });
    });

    this.updateMarkerStyles(selectedStudioId);
  }

  focusOnStudio(studio: Studio): void {
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

  fitToStudios(studios: Studio[]): void {
    if (!this.map || !this.mapboxgl) {
      return;
    }

    const locatedStudios = studios.filter(
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

    const bounds = new this.mapboxgl.LngLatBounds();
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

  updateMarkerStyles(selectedStudioId: number | null): void {
    this.markers.forEach(({ studioId, marker, element }) => {
      const isSelected = studioId === selectedStudioId;
      marker.setOffset(isSelected ? [0, -6] : [0, 0]);
      // drop-shadow() only accepts offset-x/offset-y/blur-radius/color - unlike box-shadow it has
      // no spread-radius. A 4-value form here is invalid CSS, which makes browsers silently drop
      // the *entire* filter (all functions in the list, not just the offending one), so the
      // selected-marker halo below never actually rendered before this was caught by a real test.
      element.style.filter = isSelected
        ? 'drop-shadow(0 0 6px rgba(255,255,255,0.96)) drop-shadow(0 12px 24px rgba(0,0,0,0.24))'
        : 'drop-shadow(0 10px 18px rgba(0,0,0,0.16))';
    });
  }

  private clearMarkerLayers(): void {
    this.markers.forEach(({ marker }) => marker.remove());
    this.markers = [];
  }

  private initMap(container: HTMLDivElement): void {
    const mapboxgl = this.mapboxgl!;

    this.resizeObserver = new ResizeObserver(() => this.map?.resize());
    this.resizeObserver.observe(container);

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
        this.mapCleared.emit();
      });
    });

    this.map.on('load', () => {
      this.mapLoaded = true;
      this.map?.resize();
      this.mapReady.emit();
    });
  }
}
