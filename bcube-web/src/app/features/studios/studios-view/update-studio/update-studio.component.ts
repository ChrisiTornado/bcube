import {Component, Input, OnInit} from '@angular/core';
import {finalize} from "rxjs";
import { HttpErrorResponse } from '@angular/common/http';
import { Studio } from '@models/studio.model';
import { StudioService } from '@features/studios/studio.service';
import { MessageService } from 'primeng/api';
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { UpdateStudioRequest } from '@models/requests/studio/update-studio-request';
import { ApiResponse } from '@models/responses/api-response';
import { StudioResponse } from '@models/responses/studio/studio-response';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

import { ToastModule } from 'primeng/toast';
import { DARK_BUTTON_STYLE } from '@shared/util/button-style';
import { extractErrorMessage } from '@shared/util/error-message.util';
import { PickedImage, pickedImagesToByteArrays } from '@shared/util/image-file.util';
import { buildStudioForm } from '@features/studios/shared/studio-form.util';
import { StudioFormFieldsComponent } from '@features/studios/shared/studio-form-fields/studio-form-fields.component';

@Component({
    selector: 'app-update-studio',
    imports: [ToastModule, DialogModule, TableModule, ButtonModule, ReactiveFormsModule, StudioFormFieldsComponent],
    templateUrl: './update-studio.component.html',
    styleUrl: './update-studio.component.css'
})
export class UpdateStudioComponent implements OnInit {
  @Input() studio!: Studio;
  @Input() detailMode = false;
  readonly darkButtonStyle = DARK_BUTTON_STYLE;
  loading!: boolean;

  createForm!: FormGroup;
  visible!: boolean;
  submitted!: boolean;
  pickedImages: PickedImage[] = [];

  constructor(private studioService: StudioService, private messageService: MessageService, private fb: FormBuilder) {}

ngOnInit(): void {
  this.createForm = buildStudioForm(this.fb, this.studio);
  this.pickedImages = this.getExistingGallery().map(preview => ({ preview }));
}

openDialog() {
    this.visible = true;
  }

  closeDialog() {
  this.visible = false;
  this.pickedImages = this.getExistingGallery().map(preview => ({ preview }));

  this.createForm.patchValue({
    smartlockId: this.studio.smartlockId,
    name: this.studio.name,
    description: this.studio.description,
    city: this.studio.city,
    country: this.studio.country,
    plz: this.studio.plz,
    street: this.studio.street,
    images: this.getExistingGallery()
  });
}

  onImagesChanged(images: PickedImage[]): void {
    this.pickedImages = images;
    this.createForm.patchValue({ images: images.map(image => image.preview) });
  }

submit() {
  this.submitted = true;
  if (this.createForm.invalid) return;
  this.loading = true;

  pickedImagesToByteArrays(this.pickedImages).then(galleryBytes => {
    const payload: UpdateStudioRequest = {
      id: this.studio.id,
      smartlockId: this.smartlockId.value,
      name: this.name.value,
      description: this.description.value,
      city: this.city.value,
      country: this.country.value,
      plz: this.plz.value,
      street: this.street.value,
      image: galleryBytes[0] ?? [],
      images: galleryBytes
    };

    this.studioService.update(payload)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res: ApiResponse<StudioResponse>) => {
          this.studioService.reloadAllStudios();
          this.messageService.add({ key: 'main', severity: 'success', summary: 'Erfolgreich', detail: res.message });
          this.closeDialog();
        },
        error: (e: HttpErrorResponse) => {
          const message = extractErrorMessage(e, 'Ein unbekannter Fehler ist aufgetreten.');
          this.messageService.add({ key: 'main', severity: 'error', summary: 'Fehler', detail: message });
        }
      });
  });
}

  getImageSrc(): string {
  const value = this.studio.imageBase64;

  if (!value || typeof value !== 'string') {
    return '';
  }

  return value.startsWith('data:image') ? value : 'data:image/png;base64,' + value;
}

  getExistingGallery(): string[] {
    const gallery = this.studio.imageGalleryBase64?.filter(Boolean) ?? [];
    return gallery.length > 0 ? gallery : (this.studio.imageBase64 ? [this.getImageSrc()] : []);
  }

  get name() { return this.createForm.get('name')!; }
  get description() { return this.createForm.get('description')!; }
  get city() { return this.createForm.get('city')!; }
  get country() { return this.createForm.get('country')!; }
  get plz() { return this.createForm.get('plz')!; }
  get street() { return this.createForm.get('street')!; }
  get images() { return this.createForm.get('images')!; }
  get smartlockId() { return this.createForm.get('smartlockId')!; }
}
