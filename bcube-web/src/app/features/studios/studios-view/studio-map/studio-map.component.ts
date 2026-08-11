import { Component, ElementRef, EventEmitter, NgZone, OnDestroy, Output, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import type * as MapboxGl from 'mapbox-gl';
import { environment } from '@environments/environment';
import { Studio } from '@models/studio.model';

@Component({
    selector: 'app-studio-map',
    imports: [],
    templateUrl: './studio-map.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
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
  private loadWatchdogTimer: ReturnType<typeof setTimeout> | null = null;
  private loadWatchdogAttempts = 0;
  private loadWatchdogRebuilds = 0;
  private markers: Array<{
    studioId: number;
    marker: MapboxGl.Marker;
    element: HTMLElement;
  }> = [];

  @ViewChild('mapSurface', { read: ElementRef })
  private mapSurface?: ElementRef<HTMLDivElement>;

  constructor(private ngZone: NgZone) {}

  ngOnDestroy(): void {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.loadWatchdogTimer) {
      clearTimeout(this.loadWatchdogTimer);
      this.loadWatchdogTimer = null;
    }
    this.clearMarkerLayers();
    this.map?.remove();
    this.map = null;
  }

  ensureMapInitialized(): void {
    if (!this.mapSurface || this.map) {
      return;
    }

    // The recurring "grey map" reports have repeatedly traced back to environment.token
    // regressing to this placeholder (environment.prod.ts is committed to git and has been
    // silently reverted to it more than once by unrelated commits) - failing loudly here means
    // the next regression shows up as an obvious console error instead of a mysterious grey box.
    if (!environment.token || environment.token === 'YOUR_MAPBOX_TOKEN') {
      console.error(
        'Mapbox-Karte kann nicht geladen werden: environment.token ist nicht gesetzt (Platzhalter). ' +
        'Echten Mapbox-Token in environment.ts/environment.prod.ts eintragen.'
      );
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

    // mapbox-gl normally builds its Web Worker on the fly from its own bundled source via a
    // blob URL - a step that depends on exactly how the surrounding bundler (Vite, in Angular's
    // dev server) packaged mapbox-gl's code, and can end up missing helper functions the worker
    // needs (observed live: "ReferenceError: __async is not defined" inside the worker, causing
    // every tile fetch to succeed but never get parsed - a permanently grey map with no visible
    // error at the map level). Pointing workerUrl at Mapbox's own prebuilt, dependency-free CSP
    // worker bundle (shipped in the package specifically for bundler-compatibility cases like
    // this one, served here as a static asset - see angular.json) sidesteps the bundler entirely.
    //
    // workerUrl is a getter/setter pair on mapbox-gl's CJS module.exports (backed by an internal
    // closure variable its worker-creation code actually reads). Vite/esbuild's ESM interop for
    // a dynamic import() of a CJS module snapshots that getter's value onto a plain, disconnected
    // data property on the namespace object - so `mapboxgl.workerUrl = ...` silently writes to a
    // copy nothing reads, while `mapboxgl.default` still points at the real CJS exports object
    // with the live accessor. Set it there (falling back to the namespace if there's ever no
    // `.default`, e.g. if this module is ever served as genuine ESM instead of CJS-interop).
    const workerUrlTarget = (mapboxgl as unknown as { default?: { workerUrl: string } }).default
      ?? (mapboxgl as unknown as { workerUrl: string });
    workerUrlTarget.workerUrl = '/mapbox-gl-csp-worker.js';

    // initMap can run a second time (the load watchdog rebuilding a stuck map) - disconnect
    // any observer from a previous attempt instead of leaking a second one onto the same container.
    this.resizeObserver?.disconnect();
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

    // mapbox-gl's own render loop runs on requestAnimationFrame, which browsers freeze for
    // hidden/background tabs - a map opened or left in a background tab can get stuck mid-load
    // with no error at all. Nudging resize() once the tab is visible again is enough to unstick it.
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // No listener means mapbox-gl silently no-ops instead of surfacing the error - log it and
    // retry once, since transient failures (e.g. a rate-limited style request) are recoverable.
    let retried = false;
    this.map.on('error', event => {
      console.error('Mapbox error:', event.error?.message ?? event);
      if (!retried && !this.mapLoaded) {
        retried = true;
        setTimeout(() => this.map?.setStyle('mapbox://styles/mapbox/streets-v12'), 1500);
      }
    });

    this.loadWatchdogAttempts = 0;
    this.loadWatchdogRebuilds = 0;
    this.scheduleLoadWatchdog(container);
  }

  // Covers stalls that never fire mapbox-gl's own 'error' event at all - e.g. tiles that get
  // registered but whose fetch never gets dispatched, or any other silent hang. A nudge
  // (resize + repaint) recovers most cases; if still stuck after three nudges, tear the map down
  // and build a fresh one rather than leaving a permanently grey box. Skipped while the tab is
  // actually backgrounded - the visibilitychange listener already handles that case on its own
  // once the tab is foregrounded again, so nudging/rebuilding here would just be wasted API calls.
  // Capped at a few rebuild cycles so a genuinely persistent failure (e.g. Mapbox truly down)
  // logs a final error instead of hammering the API forever.
  private scheduleLoadWatchdog(container: HTMLDivElement): void {
    this.loadWatchdogTimer = setTimeout(() => {
      if (this.mapLoaded || !this.map) {
        return;
      }

      if (document.hidden) {
        this.scheduleLoadWatchdog(container);
        return;
      }

      this.loadWatchdogAttempts++;
      console.warn(`Mapbox-Karte lädt nicht (Versuch ${this.loadWatchdogAttempts}) - erzwinge Neuzeichnung`);
      this.map.resize();
      this.map.triggerRepaint();

      if (this.loadWatchdogAttempts < 3) {
        this.scheduleLoadWatchdog(container);
        return;
      }

      this.loadWatchdogRebuilds++;
      if (this.loadWatchdogRebuilds > 3) {
        console.error('Mapbox-Karte konnte nach mehreren Neuaufbau-Versuchen nicht geladen werden - gebe auf');
        return;
      }

      console.error('Mapbox-Karte konnte nicht geladen werden - baue Karte neu auf');
      this.map.remove();
      this.map = null;
      this.mapLoaded = false;
      this.loadWatchdogAttempts = 0;
      this.initMap(container);
    }, 3000);
  }

  private readonly handleVisibilityChange = (): void => {
    if (!document.hidden) {
      this.map?.resize();
    }
  };
}
