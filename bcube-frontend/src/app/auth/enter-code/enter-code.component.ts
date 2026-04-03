import { Component, OnInit } from '@angular/core';
import { AuthContainerComponent } from '../auth-container/auth-container.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth/auth.service';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { ApiResponse } from '../../models/responses/ApiResponse';
import { ResetPasswordResponse } from '../../models/responses/user/ResetPasswordResponse';
import { VerifyCodeResponse } from '../../models/responses/user/VerifyCodeResponse';

@Component({
  selector: 'app-enter-code',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AuthContainerComponent,
    ToastModule,
    ButtonModule,
    ConfirmDialogModule
  ],
  templateUrl: './enter-code.component.html',
  styleUrls: ['./enter-code.component.css']
})
export class EnterCodeComponent implements OnInit {
  private readonly returnUrlKey = 'passwordResetReturnUrl';
  formGroup!: FormGroup;
  submitted = false;
  loading = false;
  resendCodeLoading = false;
  email: any;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    const message = localStorage.getItem('successMessage')

    if (message) {
      setTimeout(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Erfolgreich',
          detail: message
        })
      }, 0)
    }

    this.email = localStorage.getItem('resetEmail')
    console.log(this.email)
    this.formGroup = this.fb.group({
      digit1: [{ value: '', disabled: this.loading }, [Validators.required, Validators.pattern('^[0-9]$')]],
      digit2: [{ value: '', disabled: this.loading }, [Validators.required, Validators.pattern('^[0-9]$')]],
      digit3: [{ value: '', disabled: this.loading }, [Validators.required, Validators.pattern('^[0-9]$')]],
      digit4: [{ value: '', disabled: this.loading }, [Validators.required, Validators.pattern('^[0-9]$')]],
      digit5: [{ value: '', disabled: this.loading }, [Validators.required, Validators.pattern('^[0-9]$')]],
      digit6: [{ value: '', disabled: this.loading }, [Validators.required, Validators.pattern('^[0-9]$')]],
    });
  }

  get formControls() {
    return this.formGroup.controls;
  }

  moveFocus(event: any, nextFieldId: string): void {
    if (event.target.value.length === 1) {
      const nextField = document.getElementById(nextFieldId) as HTMLElement;
      if (nextField) nextField.focus();
    }
  }

  submit(): void {
    this.submitted = true;
    console.log(this.email)
    if (this.formGroup.invalid) return;

    const token = Object.values(this.formGroup.value).join('');
    this.loading = true;

    this.authService.verifyCode(this.email, token)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res: ApiResponse<VerifyCodeResponse>) => {
          localStorage.setItem('successMessage', res.message)
          this.router.navigate(['/auth/change-password'])
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Fehler',
            detail: err.error.message
          });
        }
      });
  }

  resendCode(): void {
    this.resendCodeLoading = true;
    this.loading = true;
    this.submitted = false;
    this.formGroup.disable();

    this.authService.resetPassword({ email: this.email })
      .pipe(finalize(() => {
        this.resendCodeLoading = false;
        this.loading = false
        this.formGroup.enable();
      }))
      .subscribe({
        next: (response: ApiResponse<ResetPasswordResponse>) => {
          this.resetForm();
          setTimeout(() => {
            this.messageService.add({
              severity: 'success',
              summary: 'Erfolgreich',
              detail: response.message
            });
          });
        },
        error: (err: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Fehler',
            detail: err.message
          });
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/auth/email-reset'], {
      state: { returnUrl: this.getReturnUrl() }
    });
  }

  resetForm(): void {
    this.formGroup.reset({
      digit1: '',
      digit2: '',
      digit3: '',
      digit4: '',
      digit5: '',
      digit6: '',
    });
  }

  private getReturnUrl(): string {
    return localStorage.getItem(this.returnUrlKey) || '/login';
  }
}
