import { Component, OnInit } from '@angular/core';
import { AuthContainerComponent } from '@features/auth/auth-container/auth-container.component';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '@core/services/auth.service';
import { PasswordResetService } from '@core/services/password-reset.service';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { ApiResponse } from '@models/responses/api-response';
import { ResetPasswordResponse } from '@models/responses/user/reset-password-response';
import { VerifyCodeResponse } from '@models/responses/user/verify-code-response';
import { DARK_BUTTON_STYLE, LIGHT_BUTTON_STYLE } from '@shared/util/button-style';
import { extractErrorMessage } from '@shared/util/error-message.util';

@Component({
    selector: 'app-enter-code',
    imports: [
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
  readonly darkButtonStyle = DARK_BUTTON_STYLE;
  readonly lightButtonStyle = LIGHT_BUTTON_STYLE;

  formGroup!: FormGroup;
  submitted = false;
  loading = false;
  resendCodeLoading = false;
  email: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private passwordResetService: PasswordResetService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    const message = this.passwordResetService.consumeSuccessMessage();

    if (message) {
      setTimeout(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Erfolgreich',
          detail: message
        })
      }, 0)
    }

    this.email = this.passwordResetService.getEmail();
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

  /** Auto-advances focus to the next digit box once one is filled in. */
  moveFocus(event: Event, nextFieldId: string): void {
    const input = event.target as HTMLInputElement;
    if (input.value.length === 1) {
      const nextField = document.getElementById(nextFieldId) as HTMLElement;
      if (nextField) nextField.focus();
    }
  }

  /** Jumps back to the previous box on Backspace once the current one is already empty. */
  handleBackspace(event: KeyboardEvent, previousFieldId: string | null): void {
    if (event.key !== 'Backspace' || !previousFieldId) {
      return;
    }

    const input = event.target as HTMLInputElement;
    if (input.value.length === 0) {
      const previousField = document.getElementById(previousFieldId) as HTMLInputElement | null;
      previousField?.focus();
    }
  }

  /** Lets the whole 6-digit code be pasted into any box instead of typed one field at a time. */
  handlePaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) {
      return;
    }

    event.preventDefault();
    const digitFields = ['digit1', 'digit2', 'digit3', 'digit4', 'digit5', 'digit6'];

    pasted.split('').forEach((digit, index) => {
      this.formGroup.get(digitFields[index])?.setValue(digit);
    });

    const lastFilledId = digitFields[Math.min(pasted.length, 6) - 1];
    (document.getElementById(lastFilledId) as HTMLInputElement | null)?.focus();
  }

  submit(): void {
    this.submitted = true;
    if (this.formGroup.invalid) return;

    const token = Object.values(this.formGroup.value).join('');
    this.loading = true;

    this.authService.verifyCode(this.email!, token)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res: ApiResponse<VerifyCodeResponse>) => {
          this.passwordResetService.setSuccessMessage(res.message);
          this.router.navigate(['/auth/change-password'])
        },
        error: (err: HttpErrorResponse) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Fehler',
            detail: extractErrorMessage(err, 'Ein unbekannter Fehler ist aufgetreten.')
          });
        }
      });
  }

  resendCode(): void {
    this.resendCodeLoading = true;
    this.loading = true;
    this.submitted = false;
    this.formGroup.disable();

    this.authService.resetPassword({ email: this.email! })
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
        error: (err: HttpErrorResponse) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Fehler',
            detail: extractErrorMessage(err, 'Ein unbekannter Fehler ist aufgetreten.')
          });
        }
      });
  }

  /** Returns to email-reset, carrying forward the original entry point of the reset flow. */
  goBack(): void {
    this.router.navigate(['/auth/email-reset'], {
      state: { returnUrl: this.passwordResetService.getReturnUrl() }
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
}
