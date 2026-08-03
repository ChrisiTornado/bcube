import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Studio } from '@models/studio.model';

export function buildStudioForm(fb: FormBuilder, studio?: Studio): FormGroup {
  return fb.group({
    smartlockId: [studio?.smartlockId ?? null, Validators.required],
    name: [studio?.name ?? null, Validators.required],
    description: [studio?.description ?? null, Validators.required],
    city: [studio?.city ?? null, Validators.required],
    country: [studio?.country ?? null, Validators.required],
    plz: [studio?.plz ?? null, studio ? [Validators.required, Validators.minLength(4)] : Validators.required],
    street: [studio?.street ?? null, Validators.required],
    images: [
      studio ? (studio.imageGalleryBase64 ?? [studio.imageBase64]) : null,
      studio ? [] : Validators.required
    ]
  });
}
