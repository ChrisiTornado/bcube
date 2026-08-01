import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import * as mapboxgl from 'mapbox-gl';

import { MapViewComponent } from './map-view.component';

describe('MapViewComponent', () => {
  let component: MapViewComponent;
  let fixture: ComponentFixture<MapViewComponent>;

  beforeEach(async () => {
    // Headless test Chrome has no WebGL, so mapbox-gl.Map() throws; stub it out.
    spyOn(mapboxgl, 'Map').and.returnValue({
      addControl: () => {},
      on: () => {},
      remove: () => {},
      setFog: () => {},
      flyTo: () => {}
    } as unknown as mapboxgl.Map);

    await TestBed.configureTestingModule({
      imports: [MapViewComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
