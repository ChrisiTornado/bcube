import {ComponentFixture, TestBed} from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import * as mapboxgl from 'mapbox-gl';

import {StudiosViewComponent} from './studios-view.component';

describe('StudiosViewComponent', () => {
    let component: StudiosViewComponent;
    let fixture: ComponentFixture<StudiosViewComponent>;

    beforeEach(async () => {
        // Headless test Chrome has no WebGL, so mapbox-gl.Map() throws; stub it out.
        spyOn(mapboxgl, 'Map').and.returnValue({
            addControl: () => {},
            on: () => {},
            remove: () => {},
            resize: () => {},
            scrollZoom: { enable: () => {} }
        } as unknown as mapboxgl.Map);

        await TestBed.configureTestingModule({
            imports: [StudiosViewComponent],
            providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), MessageService]
        })
            .compileComponents();

        fixture = TestBed.createComponent(StudiosViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
