import { Component, AfterViewInit } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [],
  templateUrl: './map-view.component.html',
  styleUrl: './map-view.component.css'
})
export class MapViewComponent implements AfterViewInit {

  ngAfterViewInit(): void {
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/chrisitornado/cmd60zbgu00u901qoevjtel7q',
      center: [16.3738, 48.2082],
      zoom: 12,
      accessToken: environment.token
    });

    // Beispiel-Pin hinzufügen
    new mapboxgl.Marker()
      .setLngLat([16.3738, 48.2082])
      .addTo(map);
  }
}
