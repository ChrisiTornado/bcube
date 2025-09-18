import { Component, AfterViewInit } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { environment } from '../../../../../environments/environment';
import { StudioService } from '../../../../services/studio.service';
import { studio } from '../../../../models/studio';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from '../../../../shared/loading-spinner/loading-spinner.component';
import { CardModule } from 'primeng/card';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth/auth.service';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, CardModule],
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.css']
})
export class MapViewComponent implements AfterViewInit {
  studios$!: Observable<studio[]>;
  loading$ = this.studioService.loading$;
  selectedStudio: studio | null = null;

  isAdmin = false;

  private map!: mapboxgl.Map;
  private markers: mapboxgl.Marker[] = [];

  constructor(private studioService: StudioService, private router: Router, private authService: AuthService) {}

  ngAfterViewInit(): void {
    this.isAdmin = this.authService.getRole() === "ADMIN";

    this.initMap();
    this.studios$ = this.studioService.studios$;

    // Marker immer setzen, wenn Studios kommen
    this.studios$.subscribe(studios => {
      this.clearMarkers();
      this.addMarkers(studios);
    });
  }

  private initMap() {
    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/chrisitornado/cmd60zbgu00u901qoevjtel7q',
      center: [16.3738, 48.2082],
      zoom: 12,
      accessToken: environment.token,
      attributionControl: false
    });

    this.map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      'bottom-right'
    );
  }

  private addMarkers(studios: studio[]) {
    studios.forEach(studio => {
      if (studio.longitude != null && studio.latitude != null) {
        const marker = new mapboxgl.Marker()
          .setLngLat([studio.longitude, studio.latitude])
          .addTo(this.map);

        marker.getElement().addEventListener('click', () => {
          this.selectedStudio = studio;
          this.map.flyTo({ center: [studio.longitude!, studio.latitude!], zoom: 14 });
        });

        this.markers.push(marker);
      }
    });
  }

  private clearMarkers() {
    this.markers.forEach(m => m.remove());
    this.markers = [];
  }

  navigateToStudio(selectedStudio: studio): void {
    const basePath = this.isAdmin ? '/admin-dashboard' : '/user-dashboard';
    const navigationUrl = [basePath, 'studio-details', selectedStudio.id];
    
    this.router.navigate(navigationUrl);
  }
}
