import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from "primeng/api";
import { finalize } from "rxjs";
import { HttpErrorResponse } from '@angular/common/http';
import { StudioService } from '../../../../services/studio.service';
import { CreateStudioRequest } from '../../../../models/requests/studio/CreateStudioRequest';
import { ApiResponse } from '../../../../models/responses/ApiResponse';
import { StudioResponse } from '../../../../models/responses/studio/StudioResponse';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { FileUpload, FileUploadModule, FileSelectEvent } from 'primeng/fileupload';
import { ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from '../../../../shared/loading-spinner/loading-spinner.component';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { AuthService } from '../../../../services/auth/auth.service';
import { DARK_BUTTON_STYLE } from '../../../../shared/button-style';
import { extractErrorMessage } from '../../../../shared/error-message.util';

@Component({
  selector: 'app-studios',
  standalone: true,
  imports: [InputTextModule, InputTextareaModule, LoadingSpinnerComponent, CommonModule, DialogModule, FileUploadModule, TableModule, ButtonModule, ReactiveFormsModule],
  templateUrl: './studios.component.html',
  styleUrl: './studios.component.css'
})
export class StudiosComponent implements OnInit{
  readonly darkButtonStyle = DARK_BUTTON_STYLE;

  createForm!: FormGroup;
  visible: boolean = false;
  submitted: boolean = false;
  loading: boolean = false;
  @ViewChild('fileUpload') fileUpload?: FileUpload;
  isAdmin = false;

  selectedImages: File[] = [];
  imagePreviews: string[] = [];

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

  onFileSelected(event: FileSelectEvent): void {
    const files = event?.files ?? event?.currentFiles ?? [];
    if (!files?.length) {
      return;
    }

    this.selectedImages = Array.from(files);
  this.createForm.patchValue({ images: this.selectedImages });
  this.createForm.get('images')?.updateValueAndValidity();

    Promise.all(this.selectedImages.map(file => this.readFileAsDataUrl(file))).then(previews => {
    this.imagePreviews = previews;
  });
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
    this.selectedImages = [];
    this.imagePreviews = [];

    if (this.fileUpload) {
      this.fileUpload.clear();
    }
  }

  async submit(): Promise<void> {
      this.submitted = true;
      if (this.createForm.invalid || this.selectedImages.length === 0) return;
  
      this.loading = true;
  
      try {
      const imageBytes = await Promise.all(
        this.selectedImages.map(file => this.readFileAsByteArray(file).then(bytes => Array.from(bytes)))
      );
      
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

    private readFileAsByteArray(file: File): Promise<Uint8Array> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const arrayBuffer = reader.result as ArrayBuffer;
          resolve(new Uint8Array(arrayBuffer));
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    }

    private readFileAsDataUrl(file: File): Promise<string> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ''));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
}
