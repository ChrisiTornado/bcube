import { Component, OnInit } from '@angular/core';

import { ReactiveFormsModule, AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { PasswordResetService } from '@core/services/password-reset.service';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { AuthContainerComponent } from '@features/auth/auth-container/auth-container.component';
import { InputTextModule } from 'primeng/inputtext';
import { ApiResponse } from '@models/responses/api-response';
import { ResetPasswordResponse } from '@models/responses/user/reset-password-response';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DARK_BUTTON_STYLE } from '@shared/util/button-style';
import { extractErrorMessage } from '@shared/util/error-message.util';

@Component({
    selector: 'app-email-reset',
    imports: [
    ReactiveFormsModule,
    ButtonModule,
    ToastModule,
    RippleModule,
    AuthContainerComponent,
    InputTextModule,
    ConfirmDialogModule
],
    templateUrl: './email-reset.component.html',
    styleUrl: './email-reset.component.css'
})
export class EmailResetComponent implements OnInit {
  readonly darkButtonStyle = DARK_BUTTON_STYLE;

  formGroup!: FormGroup;
  loading = false;
  submitted = false;

  constructor(private formBuilder: FormBuilder,
    private authService: AuthService,
    private passwordResetService: PasswordResetService,
    private messageService: MessageService,
    private router: Router,) {
  }

  ngOnInit(): void {
    // Captures where this flow was entered from (e.g. login) so "Zurück" can restore it later.
    const returnUrl = history.state?.returnUrl as string | undefined;
    this.passwordResetService.setReturnUrl(returnUrl);

    // Logged-in users (e.g. coming from the profile page) already have a known email.
    const knownEmail = this.authService.isAuthenticated()
      ? this.authService.resolveStoredUser()?.email ?? null
      : null;

    this.formGroup = this.formBuilder.group({
      email: [knownEmail, [Validators.required, Validators.email]]
    })
  }

  submit(): void {
    this.submitted = true;
    if (this.formGroup.invalid) return;

    this.loading = true;
    this.formGroup.disable();

    this.authService.resetPassword({ email: this.formGroup.value.email })
      .pipe(finalize(() => {
        this.loading = false;
        this.formGroup.enable();
      }))
      .subscribe({
        next: (response: ApiResponse<ResetPasswordResponse>) => {
          this.passwordResetService.setEmail(this.email.value);
          this.passwordResetService.setSuccessMessage(response.message);
          this.router.navigate(['/auth/enter-code'])
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

  goBack(): void {
    this.passwordResetService.clearEmail();
    const returnUrl = this.passwordResetService.getReturnUrl();
    this.passwordResetService.clearReturnUrl();
    this.router.navigate([returnUrl]);
  }

  get email(): AbstractControl {
    return this.formGroup.get('email')!;
  }
}
