import {
  Component,
  ViewChildren,
  ElementRef,
  QueryList,
  AfterViewInit,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import * as mapboxgl from 'mapbox-gl';
import { Subject, takeUntil } from 'rxjs';

import { environment } from '../../../../../environments/environment.local';
import { StudioService } from '../../../../services/studio.service';
import { Studio } from '../../../../models/Studio';
import { LoadingSpinnerComponent } from '../../../../shared/loading-spinner/loading-spinner.component';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../../services/auth/auth.service';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, CardModule, ButtonModule],
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.css']
})
export class MapViewComponent implements AfterViewInit, OnInit, OnDestroy {
  studios: Studio[] = [];
  loading$ = this.studioService.loading$;
  selectedStudio: Studio | null = null;
  isAdmin = false;

  readonly previewImages = [
    'assets/images/inside 1.png',
    'assets/images/interior_2.jpg',
    'assets/images/new_render_3.jpg',
    'assets/images/new_render_6.jpg',
    'assets/images/new_render_7.jpg'
  ];

  private map!: mapboxgl.Map;
  private markers: mapboxgl.Marker[] = [];
  private destroy$ = new Subject<void>();

  @ViewChildren('studioCard', { read: ElementRef }) studioCards!: QueryList<ElementRef>;

  constructor(
    private studioService: StudioService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.getRole() === 'ADMIN';

    this.studioService
      .getAllStudios()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: studios => {
          this.studios = [...studios];

          if (this.map) {
            this.clearMarkers();
            this.addMarkers(this.studios);
          }
        },
        error: err => {
          console.error('Fehler beim Laden aller Studios', err);
          this.studios = [];
        }
      });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    this.clearMarkers();

    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [16.3738, 48.2082],
      zoom: 10,
      accessToken: environment.token,
      attributionControl: false
    });

    this.map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      'bottom-right'
    );

    this.map.on('load', () => {
      this.map.setFog({
        color: 'rgba(11, 11, 11, 0.75)',
        'high-color': 'rgba(255, 167, 34, 0.08)',
        'space-color': 'rgba(7, 7, 7, 1)',
        'horizon-blend': 0.08
      });

      this.addMarkers(this.studios);
    });
  }

  private addMarkers(studios: Studio[]): void {
    studios.forEach(studio => {
      if (studio.longitude != null && studio.latitude != null) {
        const marker = new mapboxgl.Marker({ color: '#ffa722' })
          .setLngLat([studio.longitude, studio.latitude])
          .addTo(this.map);

        marker.getElement().addEventListener('click', () => {
          this.zoomToStudio(studio);
        });

        this.markers.push(marker);
      }
    });
  }

  private clearMarkers(): void {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
  }

  zoomToStudio(studio: Studio): void {
    this.selectedStudio = studio;

    if (studio.longitude != null && studio.latitude != null) {
      this.map.flyTo({
        center: [studio.longitude, studio.latitude],
        zoom: 16
      });
    }

    const index = this.studios.findIndex(s => s.id === studio.id);
    if (index > -1) {
      const [selected] = this.studios.splice(index, 1);
      this.studios.unshift(selected);
      this.studios = [...this.studios];
    }

    setTimeout(() => {
      const newIndex = this.studios.findIndex(s => s.id === studio.id);
      const card = this.studioCards.get(newIndex);

      if (card) {
        card.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  }

  resetView(): void {
    this.selectedStudio = null;

    if (this.map) {
      this.map.flyTo({
        center: [16.3738, 48.2082],
        zoom: 10
      });
    }
  }

  getSelectedPreviewImage(): string {
    if (!this.selectedStudio) {
      return this.previewImages[0];
    }

    const index = this.selectedStudio.id % this.previewImages.length;
    return this.previewImages[index];
  }

  getSelectedStudioTeaser(maxLength: number = 150): string {
    const description = this.selectedStudio?.description?.trim();

    if (!description) {
      return 'Keine Kurzbeschreibung verfügbar.';
    }

    if (description.length <= maxLength) {
      return description;
    }

    return `${description.slice(0, maxLength).trim()}...`;
  }

  navigateToStudio(selectedStudio: Studio): void {
    const basePath = this.isAdmin ? '/admin-dashboard' : '/user-dashboard';
    const navigationUrl = [basePath, 'studio-details', selectedStudio.id];

    this.router.navigate(navigationUrl, {
      state: { returnUrl: this.router.url }
    });
  }
}