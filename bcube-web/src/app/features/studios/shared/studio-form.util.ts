import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Studio } from '@models/studio.model';

export const STUDIO_IMAGE_COUNT = 5;

/** Every studio must show exactly STUDIO_IMAGE_COUNT images everywhere (list, map preview, detail
 * gallery) - enforcing an exact count here at the source (instead of padding a shorter gallery
 * with generic stock photos at display time, which is what used to happen) means what the admin
 * uploaded is always exactly what a visitor sees. */
function exactImageCountValidator(count: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    const actual = Array.isArray(value) ? value.length : 0;
    return actual === count ? null : { exactImageCount: { required: count, actual } };
  };
}

export function buildStudioForm(fb: FormBuilder, studio?: Studio): FormGroup {
  return fb.group({
    smartlockId: [studio?.smartlockId ?? null, Validators.required],
    name: [studio?.name ?? null, Validators.required],
    description: [studio?.description ?? null, Validators.required],
    city: [studio?.city ?? null, Validators.required],
    country: [studio?.country ?? null, Validators.required],
    plz: [studio?.plz ?? null, studio ? [Validators.required, Validators.minLength(4)] : Validators.required],
    street: [studio?.street ?? null, Validators.required],
    // Held in euros (not cents) since that's what the admin sees/enters via p-inputNumber's
    // currency mode - converted to hourlyRateCents only at submit time.
    hourlyRate: [studio ? studio.hourlyRateCents / 100 : null, [Validators.required, Validators.min(0.01)]],
    images: [
      studio ? (studio.imageGalleryBase64 ?? [studio.imageBase64]) : null,
      exactImageCountValidator(STUDIO_IMAGE_COUNT)
    ]
  });
}
