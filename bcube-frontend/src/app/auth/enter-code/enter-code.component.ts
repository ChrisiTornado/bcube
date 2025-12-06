import { Component, OnInit } from '@angular/core';
import { AuthContainerComponent } from '../auth-container/auth-container.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth/auth.service';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { User } from '../../models/User';

// PrimeNG
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { ApiResponse } from '../../models/responses/ApiResponse';
import { ResetPasswordResponse } from '../../models/responses/user/ResetPasswordResponse';

@Component({
  selector: 'app-enter-code',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AuthContainerComponent,
    ToastModule,
    ButtonModule
  ],
  templateUrl: './enter-code.component.html',
  styleUrls: ['./enter-code.component.css'],
  providers: [MessageService] // <--- wichtig!
})
export class EnterCodeComponent implements OnInit {
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
        next: (user) => {
          this.router.navigate(['/auth/change-password']).then(() => {
            setTimeout(() => {
              this.messageService.add({
                severity: 'success',
                summary: 'Verifizierung erfolgreich',
                detail: 'Ein neues Passwort kann nun gesetzt werden.'
              });
            });
          });
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Fehler',
            detail: err.error.error
          });
        }
      });
  }

  resendCode(): void {
    this.resendCodeLoading = true;

    this.authService.resetPassword({ email: this.formGroup.value.email })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response: ApiResponse<ResetPasswordResponse>) => {
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
    this.router.navigate(['/auth/email-reset']);
  }
}
