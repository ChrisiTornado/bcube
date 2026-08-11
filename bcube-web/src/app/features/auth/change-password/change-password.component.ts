import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

import { AuthContainerComponent } from '@features/auth/auth-container/auth-container.component';
import { AuthService } from '@core/services/auth.service';
import { PasswordResetService } from '@core/services/password-reset.service';
import { ChangePasswordRequest } from '@models/requests/user/change-password-request';
import { DARK_BUTTON_STYLE } from '@shared/util/button-style';
import { extractErrorMessage } from '@shared/util/error-message.util';

@Component({
    selector: 'app-change-password',
    imports: [
    ReactiveFormsModule,
    ToastModule,
    ConfirmDialogModule,
    InputTextModule,
    ButtonModule,
    AuthContainerComponent
],
    templateUrl: './change-password.component.html',
    styleUrl: './change-password.component.css',
    changeDetection: ChangeDetectionStrategy.Eager,
    providers: [MessageService]
})
export class ChangePasswordComponent implements OnInit {
  readonly darkButtonStyle = DARK_BUTTON_STYLE;

  formGroup!: FormGroup;
  loading = false;
  submitted = false;
  email: string | null = null;

  constructor(
    private messageService: MessageService,
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private passwordResetService: PasswordResetService
  ) {}

  ngOnInit(): void {
    const message = this.passwordResetService.consumeSuccessMessage();
    this.email = this.passwordResetService.getEmail();

    if (message) {
      setTimeout(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Erfolgreich',
          detail: message
        });
      });
    }

    this.formGroup = this.formBuilder.group({
      password: [null, [Validators.required, Validators.minLength(8)]],
      confirmPassword: [null, Validators.required]
    });
  }

  submit(): void {
    this.submitted = true;

    if (this.formGroup.invalid || this.passwordsDoNotMatch) {
      return;
    }

    this.loading = true;

    const payload: ChangePasswordRequest = {
      email: this.email!,
      password: this.password.value
    };

    this.authService.changePassword(payload)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res) => {
          this.passwordResetService.clearEmail();
          this.passwordResetService.clearReturnUrl();
          this.messageService.add({
            severity: 'success',
            summary: 'Erfolgreich',
            detail: res.message
          });
          setTimeout(() => this.router.navigate(['/login']), 1200);
        },
        error: (err: HttpErrorResponse) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Fehler',
            detail: extractErrorMessage(err, 'Unbekannter Fehler')
          });
        }
      });
  }

  /** Returns to enter-code, carrying forward the original entry point of the reset flow. */
  goBack(): void {
    this.router.navigate(['/auth/enter-code'], {
      state: { returnUrl: this.passwordResetService.getReturnUrl() }
    });
  }

  // ===== Getter =====

  get password(): AbstractControl {
    return this.formGroup.get('password')!;
  }

  get confirmPassword(): AbstractControl {
    return this.formGroup.get('confirmPassword')!;
  }

  get passwordsDoNotMatch(): boolean {
    return (
      this.submitted &&
      !!this.password.value &&
      !!this.confirmPassword.value &&
      this.password.value !== this.confirmPassword.value
    );
  }
}
