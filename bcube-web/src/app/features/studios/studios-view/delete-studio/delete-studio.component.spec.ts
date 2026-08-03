import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeleteStudioComponent } from './delete-studio.component';
import { StudioActionService } from '@features/studios/studio-action.service';
import { Studio } from '@models/studio.model';

describe('DeleteStudioComponent', () => {
  let component: DeleteStudioComponent;
  let fixture: ComponentFixture<DeleteStudioComponent>;
  let studioActionService: jasmine.SpyObj<StudioActionService>;

  const studio = { id: 1, name: 'Test Cube' } as Studio;

  beforeEach(async () => {
    studioActionService = jasmine.createSpyObj('StudioActionService', ['confirmDelete']);

    await TestBed.configureTestingModule({
      imports: [DeleteStudioComponent],
      providers: [{ provide: StudioActionService, useValue: studioActionService }]
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteStudioComponent);
    component = fixture.componentInstance;
    component.studio = studio;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('delegates to StudioActionService.confirmDelete with the current studio', () => {
    component.confirmDelete();

    expect(studioActionService.confirmDelete).toHaveBeenCalledWith(studio, jasmine.any(Function));
  });

  it('tracks the loading state via the setLoading callback', () => {
    component.confirmDelete();
    const setLoading = studioActionService.confirmDelete.calls.mostRecent().args[1]!;

    setLoading(true);
    expect(component.loading).toBeTrue();

    setLoading(false);
    expect(component.loading).toBeFalse();
  });
});
