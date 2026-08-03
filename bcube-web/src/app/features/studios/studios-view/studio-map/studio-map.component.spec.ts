import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudioMapComponent } from './studio-map.component';
import { Studio } from '@models/studio.model';

describe('StudioMapComponent', () => {
  let component: StudioMapComponent;
  let fixture: ComponentFixture<StudioMapComponent>;

  const studio = (id: number, lat?: number, lng?: number): Studio =>
    ({ id, latitude: lat, longitude: lng } as unknown as Studio);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudioMapComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(StudioMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('isMapLoaded is false before the map has finished loading', () => {
    expect(component.isMapLoaded()).toBeFalse();
  });

  describe('before the mapbox chunk has loaded', () => {
    it('resize/renderMarkers/focusOnStudio/fitToStudios/updateMarkerStyles are all safe no-ops', () => {
      expect(() => component.resize()).not.toThrow();
      expect(() => component.renderMarkers([studio(1, 48.2, 16.3)], null)).not.toThrow();
      expect(() => component.focusOnStudio(studio(1, 48.2, 16.3))).not.toThrow();
      expect(() => component.fitToStudios([studio(1, 48.2, 16.3)])).not.toThrow();
      expect(() => component.updateMarkerStyles(1)).not.toThrow();
    });

    it('ngOnDestroy is safe even without an initialized map', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('once a map is available', () => {
    let fakeMap: jasmine.SpyObj<{ flyTo: Function; fitBounds: Function; remove: Function }>;
    let fakeMarkers: any[];
    let fakeMapboxgl: any;

    class FakeMarker {
      private offset: [number, number] = [0, 0];
      element = document.createElement('div');
      constructor(_opts: unknown) {}
      setLngLat() { return this; }
      addTo() { fakeMarkers.push(this); return this; }
      getElement() { return this.element; }
      setOffset(offset: [number, number]) { this.offset = offset; }
      remove() {}
    }

    class FakeBounds {
      extend() {}
    }

    beforeEach(() => {
      fakeMarkers = [];
      fakeMap = jasmine.createSpyObj('map', ['flyTo', 'fitBounds', 'remove']);
      fakeMapboxgl = { Marker: FakeMarker, LngLatBounds: FakeBounds };

      (component as any).map = fakeMap;
      (component as any).mapboxgl = fakeMapboxgl;
      (component as any).mapLoaded = true;
    });

    it('renderMarkers creates one marker per studio with coordinates and skips the rest', () => {
      component.renderMarkers([studio(1, 48.2, 16.3), studio(2), studio(3, 48.3, 16.4)], null);

      expect((component as any).markers.length).toBe(2);
    });

    it('renderMarkers clears any previously rendered markers first', () => {
      component.renderMarkers([studio(1, 48.2, 16.3)], null);
      expect((component as any).markers.length).toBe(1);

      component.renderMarkers([studio(2, 48.3, 16.4)], null);
      expect((component as any).markers.length).toBe(1);
      expect((component as any).markers[0].studioId).toBe(2);
    });

    it('updateMarkerStyles highlights only the selected marker', () => {
      component.renderMarkers([studio(1, 48.2, 16.3), studio(2, 48.3, 16.4)], null);
      component.updateMarkerStyles(2);

      const [first, second] = (component as any).markers;
      expect(first.element.style.filter).not.toContain('0.96');
      expect(second.element.style.filter).toContain('0.96');
      expect(first.element.style.filter).not.toEqual(second.element.style.filter);
    });

    it('focusOnStudio flies to the studio coordinates', () => {
      component.focusOnStudio(studio(1, 48.2, 16.3));

      expect(fakeMap.flyTo).toHaveBeenCalledWith(jasmine.objectContaining({ center: [16.3, 48.2] }));
    });

    it('focusOnStudio does nothing for a studio without coordinates', () => {
      component.focusOnStudio(studio(1));
      expect(fakeMap.flyTo).not.toHaveBeenCalled();
    });

    it('fitToStudios flies to the default center when no studio has coordinates', () => {
      component.fitToStudios([studio(1), studio(2)]);

      expect(fakeMap.flyTo).toHaveBeenCalledWith(jasmine.objectContaining({ center: [16.3738, 48.2082] }));
      expect(fakeMap.fitBounds).not.toHaveBeenCalled();
    });

    it('fitToStudios fits the bounds of all located studios', () => {
      component.fitToStudios([studio(1, 48.2, 16.3), studio(2, 48.3, 16.4)]);

      expect(fakeMap.fitBounds).toHaveBeenCalled();
      expect(fakeMap.flyTo).not.toHaveBeenCalled();
    });

    it('ngOnDestroy removes the map and clears markers', () => {
      component.renderMarkers([studio(1, 48.2, 16.3)], null);

      component.ngOnDestroy();

      expect(fakeMap.remove).toHaveBeenCalled();
      expect((component as any).markers.length).toBe(0);
    });
  });
});
