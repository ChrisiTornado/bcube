import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from "primeng/api";
import { finalize } from "rxjs";
import { StudioService } from '../../../../services/studio.service';
import { studio } from '../../../../models/studio';
import { CreateStudioRequest } from '../../../../models/requests/CreateStudioRequest';
import { ApiResponse } from '../../../../models/responses/ApiResponse';
import { StudioResponse } from '../../../../models/responses/StudioResponse';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from '../../../../shared/loading-spinner/loading-spinner.component';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-studios',
  standalone: true,
  imports: [InputTextModule, LoadingSpinnerComponent, CommonModule, DialogModule, FileUploadModule, TableModule, ButtonModule, ReactiveFormsModule],
  templateUrl: './studios.component.html',
  styleUrl: './studios.component.css'
})
export class StudiosComponent implements OnInit{
  createForm!: FormGroup;
  visible: boolean = false;
  submitted: boolean = false;
  loading: boolean = false;
  studios: studio[] = [];
  @ViewChild('fileUpload') fileUpload: any;

  selectedImage: File | null = null;

  constructor(private fb: FormBuilder,
              public studioService: StudioService,
              private messageService: MessageService) { }

   ngOnInit(): void {
    this.createForm = this.fb.group({
      name: [null, Validators.required],
      description: [null, Validators.required],
      city: [null, Validators.required],
      country: [null, Validators.required],
      plz: [null, Validators.required],
      street: [null, Validators.required],
      image: [null, Validators.required]
    });
  }

  onFileSelected(event: any): void {
  const file = event.files?.[0];
  if (file) {
    this.selectedImage = file;
    this.createForm.patchValue({ image: file });
    this.createForm.get('image')?.updateValueAndValidity();
  }
}

  get name() { return this.createForm.get('name')!; }
  get description() { return this.createForm.get('description')!; }
  get city() { return this.createForm.get('city')!; }
  get country() { return this.createForm.get('country')!; }
  get plz() { return this.createForm.get('plz')!; }
  get street() { return this.createForm.get('street')!; }
  get image() { return this.createForm.get('image')!; }

  openDialog(): void {
    this.visible = true;
  }

  closeDialog(): void {
    this.visible = false;
    this.createForm.reset();
    this.submitted = false;
    this.selectedImage = null;
  }

  async submit(): Promise<void> {
      this.submitted = true;
      if (this.createForm.invalid || !this.selectedImage) return;
  
      this.loading = true;
  
      try {
      const imageBytes = await this.readFileAsByteArray(this.selectedImage);
      
      const payload: CreateStudioRequest = {
        name: this.name.value,
        description: this.description.value,
        city: this.city.value,
        country: this.country.value,
        plz: this.plz.value,
        street: this.street.value,
        image: Array.from(imageBytes)
      };
  
      this.studioService.create(payload)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: (res: ApiResponse<StudioResponse>) => {
            this.studioService.reloadStudios();
            this.closeDialog()
            this.messageService.add({
              key: 'main',
              severity: 'success',
              summary: 'Erfolg',
              detail: res.message
            });
          },
          error: (e) => {
            const message = e?.error?.message ?? 'Ein unbekannter Fehler ist aufgetreten.';
            this.messageService.add({
              key: 'main',
              severity: 'error',
              summary: 'Fehler',
              detail: message
            });
          }
        });
      } catch {}
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
}
