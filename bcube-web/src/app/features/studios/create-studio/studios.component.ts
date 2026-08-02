import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from "primeng/api";
import { finalize } from "rxjs";
import { HttpErrorResponse } from '@angular/common/http';
import { StudioService } from '@features/studios/studio.service';
import { CreateStudioRequest } from '@models/requests/studio/create-studio-request';
import { ApiResponse } from '@models/responses/api-response';
import { StudioResponse } from '@models/responses/studio/studio-response';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';

import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { AuthService } from '@core/services/auth.service';
import { DARK_BUTTON_STYLE } from '@shared/util/button-style';
import { extractErrorMessage } from '@shared/util/error-message.util';
import { PickedImage, pickedImagesToByteArrays } from '@shared/util/image-file.util';
import { StudioImagePickerComponent } from '@features/studios/studio-image-picker/studio-image-picker.component';

@Component({
    selector: 'app-studios',
    imports: [InputTextModule, TextareaModule, DialogModule, TableModule, ButtonModule, ReactiveFormsModule, StudioImagePickerComponent],
    templateUrl: './studios.component.html',
    styleUrl: './studios.component.css'
})
export class StudiosComponent implements OnInit{
  readonly darkButtonStyle = DARK_BUTTON_STYLE;

  createForm!: FormGroup;
  visible: boolean = false;
  submitted: boolean = false;
  loading: boolean = false;
  isAdmin = false;

  pickedImages: PickedImage[] = [];

  constructor(private fb: FormBuilder,
              public studioService: StudioService,
              private messageService: MessageService,
              private authService: AuthService) { }

   ngOnInit(): void {
    this.createForm = this.fb.group({
      smartlockId: [null, Validators.required],
      name: [null, Validators.required],
      description: [null, Validators.required],
      city: [null, Validators.required],
      country: [null, Validators.required],
      plz: [null, Validators.required],
      street: [null, Validators.required],
      images: [null, Validators.required]
    });
    this.isAdmin = this.authService.getRole() === "ADMIN"
  }

  onImagesChanged(images: PickedImage[]): void {
    this.pickedImages = images;
    this.createForm.patchValue({ images: images.length > 0 ? images : null });
    this.createForm.get('images')?.updateValueAndValidity();
  }

  get smartlockId() { return this.createForm.get('smartlockId')!; }
  get name() { return this.createForm.get('name')!; }
  get description() { return this.createForm.get('description')!; }
  get city() { return this.createForm.get('city')!; }
  get country() { return this.createForm.get('country')!; }
  get plz() { return this.createForm.get('plz')!; }
  get street() { return this.createForm.get('street')!; }
  get images() { return this.createForm.get('images')!; }

  openDialog(): void {
    this.visible = true;
  }

  closeDialog(): void {
    this.visible = false;
    this.createForm.reset();
    this.submitted = false;
    this.pickedImages = [];
  }

  async submit(): Promise<void> {
      this.submitted = true;
      if (this.createForm.invalid || this.pickedImages.length === 0) return;

      this.loading = true;

      try {
      const imageBytes = await pickedImagesToByteArrays(this.pickedImages);

      const payload: CreateStudioRequest = {
        smartlockId: this.smartlockId.value,
        name: this.name.value,
        description: this.description.value,
        city: this.city.value,
        country: this.country.value,
        plz: this.plz.value,
        street: this.street.value,
        image: imageBytes[0] ?? [],
        images: imageBytes
      };

      this.studioService.create(payload)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: (res: ApiResponse<StudioResponse>) => {
            this.studioService.reloadAllStudios();
            this.closeDialog()
            this.messageService.add({
              key: 'main',
              severity: 'success',
              summary: 'Erfolg',
              detail: res.message
            });
          },
          error: (e: HttpErrorResponse) => {
            const message = extractErrorMessage(e, 'Ein unbekannter Fehler ist aufgetreten.');
            this.messageService.add({
              key: 'main',
              severity: 'error',
              summary: 'Fehler',
              detail: message
            });
          }
        });
      } catch {
        // Swallow FileReader failures here; the form stays in its current (loading) state without a toast.
      }
    }
}
