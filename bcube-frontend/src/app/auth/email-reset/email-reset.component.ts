import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { AuthContainerComponent } from '../auth-container/auth-container.component';
import { InputTextModule } from 'primeng/inputtext';
import { ApiResponse } from '../../models/responses/ApiResponse';
import { ResetPasswordResponse } from '../../models/responses/user/ResetPasswordResponse';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-email-reset',
  standalone: true,
  imports: [
    CommonModule,
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
export class EmailResetComponent {
  private readonly returnUrlKey = 'passwordResetReturnUrl';
  @Input() notification!: Notification;
  formGroup!: FormGroup;
  loading = false;
  submitted = false;

  constructor(private formBuilder: FormBuilder,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router,) {
  }

  ngOnInit(): void {
    const returnUrl = history.state?.returnUrl as string | undefined;
    localStorage.setItem(this.returnUrlKey, returnUrl || '/login');

    this.formGroup = this.formBuilder.group({
      email: [null, [Validators.required, Validators.email]]
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
          console.log(this.email.value)
          localStorage.setItem('resetEmail', this.email.value);
          localStorage.setItem('successMessage', response.message)
          this.router.navigate(['/auth/enter-code'])
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
    localStorage.removeItem('resetEmail');
    const returnUrl = this.getReturnUrl();
    localStorage.removeItem(this.returnUrlKey);
    this.router.navigate([returnUrl]);
  }

  get email(): AbstractControl {
    return this.formGroup.get('email')!;
  }

  private getReturnUrl(): string {
    return localStorage.getItem(this.returnUrlKey) || '/login';
  }
}
