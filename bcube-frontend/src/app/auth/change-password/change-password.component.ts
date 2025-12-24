import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

import { AuthContainerComponent } from '../auth-container/auth-container.component';
import { AuthService } from '../../services/auth/auth.service';
import { ChangePasswordRequest } from '../../models/requests/user/ChangePasswordRequest';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    // PrimeNG
    ToastModule,
    ConfirmDialogModule,
    InputTextModule,
    ButtonModule,

    // Eigene Component
    AuthContainerComponent
  ],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css',
  providers: [MessageService]
})
export class ChangePasswordComponent implements OnInit {

  formGroup!: FormGroup;
  loading = false;
  submitted = false;
  email: string | null = null;

  constructor(
    private messageService: MessageService,
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const message = localStorage.getItem('successMessage');
    this.email = localStorage.getItem('resetEmail');

    if (message) {
      setTimeout(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Erfolgreich',
          detail: message
        });
      });
      localStorage.removeItem('successMessage');
    }

    this.formGroup = this.formBuilder.group({
      password: [null, Validators.required],
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
          localStorage.setItem('successMessage', res.message);
          localStorage.removeItem('resetEmail');
          this.router.navigate(['/auth/login']);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Fehler',
            detail: err?.error?.message ?? 'Unbekannter Fehler'
          });
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/auth/enter-code']);
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