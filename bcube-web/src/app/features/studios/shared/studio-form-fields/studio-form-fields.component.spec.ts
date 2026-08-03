import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormBuilder, FormControl } from '@angular/forms';
import { StudioFormFieldsComponent } from './studio-form-fields.component';
import { StudioImagePickerComponent } from '@features/studios/studio-image-picker/studio-image-picker.component';
import { buildStudioForm } from '@features/studios/shared/studio-form.util';

describe('StudioFormFieldsComponent', () => {
  let component: StudioFormFieldsComponent;
  let fixture: ComponentFixture<StudioFormFieldsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudioFormFieldsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(StudioFormFieldsComponent);
    component = fixture.componentInstance;
    component.form = buildStudioForm(new FormBuilder());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes each field as a FormControl resolved from the given form group', () => {
    expect(component.name).toBe(component.form.get('name') as FormControl);
    expect(component.description).toBe(component.form.get('description') as FormControl);
    expect(component.city).toBe(component.form.get('city') as FormControl);
    expect(component.country).toBe(component.form.get('country') as FormControl);
    expect(component.plz).toBe(component.form.get('plz') as FormControl);
    expect(component.street).toBe(component.form.get('street') as FormControl);
    expect(component.smartlockId).toBe(component.form.get('smartlockId') as FormControl);
    expect(component.images).toBe(component.form.get('images')!);
  });

  it('does not show validation errors before submitted is true', () => {
    component.submitted = false;
    fixture.detectChanges();

    const errors = fixture.nativeElement.querySelectorAll('.field-error');
    expect(errors.length).toBe(0);
  });

  it('shows required-field errors once submitted is true and fields are empty', () => {
    component.submitted = true;
    fixture.detectChanges();

    const errors = fixture.nativeElement.querySelectorAll('.field-error');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('only shows the missing-image error when showImageError is true', () => {
    component.submitted = true;
    component.showImageError = false;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Mindestens ein Cubebild ist erforderlich');

    component.showImageError = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Mindestens ein Cubebild ist erforderlich');
  });

  it('emits imagesChange when the image picker reports new images', () => {
    const emitted: unknown[] = [];
    component.imagesChange.subscribe(value => emitted.push(value));

    const picker = fixture.debugElement.query(By.directive(StudioImagePickerComponent));
    picker.componentInstance.imagesChange.emit([{ preview: 'data:image/png;base64,x' }]);

    expect(emitted).toEqual([[{ preview: 'data:image/png;base64,x' }]]);
  });
});
