import {Component, Input, ViewChild, OnInit} from '@angular/core';
import {finalize} from "rxjs";
import { Studio } from '../../../../../models/Studio';
import { StudioService } from '../../../../../services/studio.service';
import { MessageService } from 'primeng/api';
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { UpdateStudioRequest } from '../../../../../models/requests/studio/UpdateStudioRequest';
import { ApiResponse } from '../../../../../models/responses/ApiResponse';
import { StudioResponse } from '../../../../../models/responses/studio/StudioResponse';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from '../../../../../shared/loading-spinner/loading-spinner.component';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-update-studio',
  standalone: true,
  imports: [ToastModule, InputTextModule, InputTextareaModule, LoadingSpinnerComponent, CommonModule, DialogModule, TableModule, ButtonModule, FileUploadModule, ReactiveFormsModule],
  templateUrl: './update-studio.component.html',
  styleUrl: './update-studio.component.css'
})
export class UpdateStudioComponent implements OnInit {
  @Input() studio!: Studio;
  @Input() detailMode = false;
  loading!: boolean;
  selectedImageBase64: string | null = null;
  galleryPreviews: string[] = [];

  createForm!: FormGroup;
  visible!: boolean;
  submitted!: boolean;
  selectedImages: File[] = [];
  selectedImageBytes: number[][] = [];
  @ViewChild('fileUpload') fileUpload: any;

  constructor(private studioService: StudioService, private messageService: MessageService, private fb: FormBuilder) {}

ngOnInit(): void {
  this.createForm = this.fb.group({
    name: [this.studio.name, Validators.required],
    description: [this.studio.description, Validators.required],
    city: [this.studio.city, Validators.required],
    country: [this.studio.country, Validators.required],
    plz: [this.studio.plz, [Validators.required, Validators.minLength(4)]],
    street: [this.studio.street, Validators.required],
    images: [this.studio.imageGalleryBase64 ?? [this.studio.imageBase64]]
  });

  this.galleryPreviews = this.getExistingGallery();
}

openDialog() {
    this.visible = true;
  }

  closeDialog() {
  this.visible = false;
  this.selectedImages = [];
  this.selectedImageBase64 = null;
  this.selectedImageBytes = [];
  this.galleryPreviews = this.getExistingGallery();
  this.fileUpload?.clear();

  this.createForm.patchValue({
    name: this.studio.name,
    description: this.studio.description,
    city: this.studio.city,
    country: this.studio.country,
    plz: this.studio.plz,
    street: this.studio.street,
    images: this.getExistingGallery()
  });
}

  onFileSelected(event: any): void {
    const files = event.files as File[] | undefined;
    if (!files?.length) {
      return;
    }

    this.selectedImages = files;

    Promise.all(files.map(file => this.readFileAsByteArray(file).then(bytes => Array.from(bytes)))).then(images => {
      this.selectedImageBytes = images;
    });

    Promise.all(files.map(file => this.readFileAsDataUrl(file))).then(previews => {
      this.galleryPreviews = previews;
      this.createForm.patchValue({ images: previews });
    });
  }

submit() {
  this.submitted = true;
  if (this.createForm.invalid) return;
  this.loading = true;

  const convertBase64ToByteArray = (base64String: string): number[] => {
    const binary = atob(base64String);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return Array.from(bytes);
  };

  let galleryBytes: number[][] = [];

  if (this.selectedImageBytes.length > 0) {
    galleryBytes = this.selectedImageBytes;
  } else if (Array.isArray(this.images?.value)) {
    galleryBytes = this.images.value
      .filter((value: unknown) => typeof value === 'string')
      .map((value: string) => {
        const base64String = value.split(',')[1] || value;
        return convertBase64ToByteArray(base64String);
      });
  }

  const payload: UpdateStudioRequest = {
    id: this.studio.id,
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
      error: (e: any) => {
        const message = e?.error?.message ?? 'Ein unbekannter Fehler ist aufgetreten.';
        this.messageService.add({ key: 'main', severity: 'error', summary: 'Fehler', detail: message });
      }
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

  private readFileAsByteArray(file: File): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
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
