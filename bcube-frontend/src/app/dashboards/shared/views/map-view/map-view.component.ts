import { Component, OnInit } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { environment } from '../../../../../environments/environment';
import { StudioService } from '../../../../services/studio.service';
import { studio } from '../../../../models/studio';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { LoadingSpinnerComponent } from '../../../../shared/loading-spinner/loading-spinner.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [LoadingSpinnerComponent, CommonModule],
  templateUrl: './map-view.component.html',
  styleUrl: './map-view.component.css'
})
export class MapViewComponent implements OnInit {
  studios$!: Observable<studio[]>;
  loading$ = this.studioService.loading$;
  selectedStudio: studio | null = null;

  constructor(private studioService: StudioService) {}

  ngOnInit(): void {
    this.studios$ = this.studioService.studios$;

    this.studios$.pipe(take(1)).subscribe(studios => {
      const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/chrisitornado/cmd60zbgu00u901qoevjtel7q',
        center: [16.3738, 48.2082],
        zoom: 12,
        accessToken: environment.token,
        attributionControl: false
      });

      map.addControl(new mapboxgl.AttributionControl({
        compact: true,
        customAttribution: '© Mapbox © OpenStreetMap'
      }), 'bottom-right');

      studios.forEach(studio => {
        if (studio.longitude != null && studio.latitude != null) {
          const marker = new mapboxgl.Marker()
            .setLngLat([studio.longitude, studio.latitude])
            .addTo(map);

          marker.getElement().addEventListener('click', () => {
            this.selectedStudio = studio;
          });
        }
      });
    });
  }
}
