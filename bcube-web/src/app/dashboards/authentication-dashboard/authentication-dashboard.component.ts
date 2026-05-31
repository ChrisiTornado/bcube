import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { AuthContainerComponent } from '../../auth/auth-container/auth-container.component';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { finalize } from 'rxjs';
import { AccessService, CheckInResponse } from '../../services/access.service';

@Component({
  selector: 'app-authentication-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AuthContainerComponent, ToastModule, ButtonModule],
  templateUrl: './authentication-dashboard.component.html',
  styleUrl: './authentication-dashboard.component.css',
  providers: [MessageService]
})
export class AuthenticationDashboardComponent implements OnInit, OnDestroy {
  @ViewChild('videoEl') videoEl!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl') canvasEl!: ElementRef<HTMLCanvasElement>;

  step: 1 | 2 | 3 = 1;
  formGroup!: FormGroup;
  submitted = false;
  loading = false;

  checkInData: CheckInResponse | null = null;
  cameraStream: MediaStream | null = null;
  cameraError = false;
  nukiCode: number | null = null;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private accessService: AccessService
  ) {}

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      digit1: ['', [Validators.required, Validators.pattern('^[0-9]$')]],
      digit2: ['', [Validators.required, Validators.pattern('^[0-9]$')]],
      digit3: ['', [Validators.required, Validators.pattern('^[0-9]$')]],
      digit4: ['', [Validators.required, Validators.pattern('^[0-9]$')]],
      digit5: ['', [Validators.required, Validators.pattern('^[0-9]$')]],
      digit6: ['', [Validators.required, Validators.pattern('^[0-9]$')]],
    });
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  moveFocus(event: any, nextFieldId: string): void {
    if (event.target.value.length === 1) {
      const next = document.getElementById(nextFieldId);
      if (next) next.focus();
    }
  }

  // Step 1: verify auth code
  submitCode(): void {
    this.submitted = true;
    if (this.formGroup.invalid) return;

    const code = Object.values(this.formGroup.value).join('');
    this.loading = true;

    this.accessService.checkIn(code)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data) => {
          this.checkInData = data;
          this.step = 2;
          setTimeout(() => this.startCamera(), 100);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Fehler',
            detail: err?.error?.message ?? 'Ungültiger Code'
          });
        }
      });
  }

  // Step 2: camera
  startCamera(): void {
    this.cameraError = false;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then(stream => {
        this.cameraStream = stream;
        if (this.videoEl?.nativeElement) {
          this.videoEl.nativeElement.srcObject = stream;
        }
      })
      .catch(() => {
        this.cameraError = true;
      });
  }

  stopCamera(): void {
    this.cameraStream?.getTracks().forEach(t => t.stop());
    this.cameraStream = null;
  }

  captureAndVerify(): void {
    const video = this.videoEl?.nativeElement;
    const canvas = this.canvasEl?.nativeElement;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);

    this.loading = true;
    canvas.toBlob(blob => {
      if (!blob) {
        this.loading = false;
        return;
      }
      this.stopCamera();
      this.accessService.verifyFace(blob, this.checkInData!.bookingId)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: (res) => {
            if (res.verified) {
              this.generateNukiCode();
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Fehler',
                detail: 'Gesichtserkennung fehlgeschlagen'
              });
              setTimeout(() => this.startCamera(), 300);
            }
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Fehler',
              detail: err?.error?.message ?? 'Verifikation fehlgeschlagen'
            });
            setTimeout(() => this.startCamera(), 300);
          }
        });
    }, 'image/jpeg', 0.9);
  }

  private generateNukiCode(): void {
    this.loading = true;
    this.accessService.generateNukiCode(this.checkInData!.bookingId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res) => {
          this.nukiCode = res.accessCode;
          this.step = 3;
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Fehler',
            detail: err?.error?.message ?? 'Nuki-Code konnte nicht generiert werden'
          });
        }
      });
  }

  reset(): void {
    this.step = 1;
    this.submitted = false;
    this.checkInData = null;
    this.nukiCode = null;
    this.formGroup.reset();
    this.stopCamera();
  }

  get stepTitle(): string {
    if (this.step === 1) return 'Code eingeben';
    if (this.step === 2) return 'Gesicht scannen';
    return 'Zutrittscode';
  }
}
