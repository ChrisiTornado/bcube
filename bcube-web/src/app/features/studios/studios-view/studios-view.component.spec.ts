import {ComponentFixture, TestBed} from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { StudioMapComponent } from '@features/studios/studios-view/studio-map/studio-map.component';

import {StudiosViewComponent} from '@features/studios/studios-view/studios-view.component';

describe('StudiosViewComponent', () => {
    let component: StudiosViewComponent;
    let fixture: ComponentFixture<StudiosViewComponent>;

    beforeEach(async () => {
        // mapbox-gl is loaded via dynamic import() at runtime and headless test Chrome has no
        // WebGL, so prevent the map from ever initializing rather than stubbing mapbox-gl itself.
        spyOn(StudioMapComponent.prototype, 'ensureMapInitialized');

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

    describe('gallery index wraparound', () => {
        const studio = (id: number, gallery: string[]) => ({ id, gallery } as any);

        it('advances the index on next and wraps past the last image to the first', () => {
            const s = studio(1, ['a', 'b', 'c']);
            const event = new Event('click');

            component.showNextStudioImage(s, event);
            expect(component.getStudioImageIndex(s)).toBe(1);

            component.showNextStudioImage(s, event);
            expect(component.getStudioImageIndex(s)).toBe(2);

            component.showNextStudioImage(s, event);
            expect(component.getStudioImageIndex(s)).toBe(0);
        });

        it('wraps backward past the first image to the last', () => {
            const s = studio(2, ['a', 'b', 'c']);
            const event = new Event('click');

            component.showPreviousStudioImage(s, event);
            expect(component.getStudioImageIndex(s)).toBe(2);
        });

        it('tracks each studio\'s index independently', () => {
            const first = studio(3, ['a', 'b']);
            const second = studio(4, ['x', 'y']);
            const event = new Event('click');

            component.showNextStudioImage(first, event);
            expect(component.getStudioImageIndex(first)).toBe(1);
            expect(component.getStudioImageIndex(second)).toBe(0);
        });

        it('does not advance for a gallery with fewer than 2 images', () => {
            const s = studio(5, ['only']);
            const event = new Event('click');

            component.showNextStudioImage(s, event);
            component.showPreviousStudioImage(s, event);

            expect(component.getStudioImageIndex(s)).toBe(0);
        });

        it('clamps to 0 for an empty gallery', () => {
            expect(component.getStudioImageIndex(studio(6, []))).toBe(0);
        });
    });

    describe('map preview index wraparound', () => {
        const studio = (id: number, gallery: string[]) => ({ id, gallery } as any);

        it('advances and wraps the shared map-preview index', () => {
            const s = studio(7, ['a', 'b']);
            const event = new Event('click');

            component.showNextMapPreviewImage(s, event);
            expect(component.getMapPreviewImageIndex(s)).toBe(1);

            component.showNextMapPreviewImage(s, event);
            expect(component.getMapPreviewImageIndex(s)).toBe(0);
        });

        it('wraps backward past the first image to the last', () => {
            const s = studio(8, ['a', 'b', 'c']);
            const event = new Event('click');

            component.showPreviousMapPreviewImage(s, event);
            expect(component.getMapPreviewImageIndex(s)).toBe(2);
        });
    });
});
