import { Component, ViewChildren, ElementRef, QueryList, AfterViewInit, OnInit } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { environment } from '../../../../../environments/environment';
import { StudioService } from '../../../../services/studio.service';
import { Studio } from '../../../../models/Studio';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from '../../../../shared/loading-spinner/loading-spinner.component';
import { CardModule } from 'primeng/card';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth/auth.service';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, CardModule, ButtonModule],
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.css']
})
export class MapViewComponent implements AfterViewInit, OnInit {
  studios$!: Observable<Studio[]>;
  loading$ = this.studioService.loading$;
  selectedStudio: Studio | null = null;
  isAdmin = false;

  private map!: mapboxgl.Map;
  private markers: mapboxgl.Marker[] = [];

  @ViewChildren('studioCard', { read: ElementRef }) studioCards!: QueryList<ElementRef>;

  constructor(private studioService: StudioService, private router: Router, private authService: AuthService) { }

  ngOnInit(): void {
    this.isAdmin = this.authService.getRole() === "ADMIN";
    this.studios$ = this.studioService.studios$;
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.studios$.subscribe(studios => {
      this.clearMarkers();
      this.addMarkers(studios);
    });
  }

  private initMap() {
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
    });
  }

  private addMarkers(studios: Studio[]) {
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

  zoomToStudio(studio: Studio): void {
    this.selectedStudio = studio;
    if (studio.longitude && studio.latitude) {
      this.map.flyTo({ center: [studio.longitude, studio.latitude], zoom: 16 });
    }

    this.studioService.moveStudioToTop(studio);

    // Card nach oben scrollen
    setTimeout(() => {
      const index = this.studioService.currentStudios.findIndex(s => s.id === studio.id);
      const card = this.studioCards.get(index);
      if (card) {
        card.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  private clearMarkers() {
    this.markers.forEach(m => m.remove());
    this.markers = [];
  }

  resetView(): void {
    this.selectedStudio = null;
  this.map.flyTo({
    center: [16.3738, 48.2082], // Startpunkt (Wien)
    zoom: 10
  });
}

  navigateToStudio(selectedStudio: Studio): void {
    const basePath = this.isAdmin ? '/admin-dashboard' : '/user-dashboard';
    const navigationUrl = [basePath, 'studio-details', selectedStudio.id];
    this.router.navigate(navigationUrl);
  }
}
