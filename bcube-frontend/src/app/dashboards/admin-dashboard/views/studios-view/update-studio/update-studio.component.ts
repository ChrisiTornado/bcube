import {Component, Input, ViewChild, OnInit} from '@angular/core';
import {finalize} from "rxjs";
import { studio } from '../../../../../models/studio';
import { StudioService } from '../../../../../services/studio.service';
import { MessageService } from 'primeng/api';
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { UpdateStudioRequest } from '../../../../../models/requests/UpdateStudioRequest';
import { ApiResponse } from '../../../../../models/responses/ApiResponse';
import { StudioResponse } from '../../../../../models/responses/StudioResponse';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from '../../../../../shared/loading-spinner/loading-spinner.component';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-update-studio',
  standalone: true,
  imports: [InputTextModule, LoadingSpinnerComponent, CommonModule, DialogModule, TableModule, ButtonModule, FileUploadModule, ReactiveFormsModule],
  templateUrl: './update-studio.component.html',
  styleUrl: './update-studio.component.css'
})
export class UpdateStudioComponent implements OnInit {
  @Input() studio!: studio;
  loading!: boolean;
  selectedImageBase64: string | null = null;

  createForm!: FormGroup;
  visible!: boolean;
  submitted!: boolean;
  selectedImage: File | null = null;
  selectedImageBytes: number[] | null = null;
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
    image: [this.studio.imageBase64]
  });
}

openDialog() {
    this.visible = true;
  }

  closeDialog() {
  this.visible = false;
  this.selectedImage = null;
  this.selectedImageBase64 = null;
  this.fileUpload.clear();

  this.createForm.patchValue({
    name: this.studio.name,
    description: this.studio.description,
    city: this.studio.city,
    country: this.studio.country,
    plz: this.studio.plz,
    street: this.studio.street,
    image: this.studio.imageBase64
  });
}

  onFileSelected(event: any): void {
  const file = event.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      this.selectedImageBytes = Array.from(new Uint8Array(arrayBuffer));
    };
    reader.readAsArrayBuffer(file);
  }
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

  let imageBytes: number[] | null = null;

  if (this.selectedImageBytes) {
    // Neues Bild wurde hochgeladen → verwende es
    imageBytes = this.selectedImageBytes;
  } else if (this.image?.value && typeof this.image.value === 'string') {
    // Bestehendes Bild verwenden → Base64-Header entfernen und dekodieren
    const base64String = this.image.value.split(',')[1] || this.image.value; // falls kein Komma vorhanden
    imageBytes = convertBase64ToByteArray(base64String);
  }

  const payload: UpdateStudioRequest = {
    id: this.studio.id,
    name: this.name.value,
    description: this.description.value,
    city: this.city.value,
    country: this.country.value,
    plz: this.plz.value,
    street: this.street.value,
    image: imageBytes ?? []
  };

  this.studioService.update(payload)
    .pipe(finalize(() => this.loading = false))
    .subscribe({
      next: (res: ApiResponse<StudioResponse>) => {
        this.studioService.reloadStudios();
        this.messageService.add({ severity: 'success', summary: 'Erfolgreich', detail: res.message });
        this.closeDialog();
      },
      error: (e: any) => {
        const message = e?.error?.message ?? 'Ein unbekannter Fehler ist aufgetreten.';
        this.messageService.add({ severity: 'error', summary: 'Fehler', detail: message });
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

  get name() { return this.createForm.get('name')!; }
  get description() { return this.createForm.get('description')!; }
  get city() { return this.createForm.get('city')!; }
  get country() { return this.createForm.get('country')!; }
  get plz() { return this.createForm.get('plz')!; }
  get street() { return this.createForm.get('street')!; }
  get image() { return this.createForm.get('image')!; }
}
