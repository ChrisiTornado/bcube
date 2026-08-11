import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { AbstractControl, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from '@angular/router';

import { RouterModule } from '@angular/router';
import { AuthContainerComponent } from '@features/auth/auth-container/auth-container.component';
import { ButtonModule } from "primeng/button";
import { ReactiveFormsModule } from '@angular/forms';
import { MessageService } from "primeng/api";
import { finalize } from "rxjs";
import { HttpErrorResponse } from '@angular/common/http';
import { LoadingSpinnerComponent } from '@shared/ui/loading-spinner/loading-spinner.component';
import { RegisterRequest } from '@models/requests/user/register-request';
import { ApiResponse } from '@models/responses/api-response';
import { JwtResponse } from '@models/responses/user/jwt-response';
import { InputTextModule } from 'primeng/inputtext';
import { handleAuthSuccess } from '@features/auth/shared/auth-success.util';
import { extractErrorMessage } from '@shared/util/error-message.util';

@Component({
    selector: 'app-register',
    imports: [InputTextModule, LoadingSpinnerComponent, RouterModule, AuthContainerComponent, ButtonModule, ReactiveFormsModule],
    templateUrl: './register.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading!: boolean;
  submitted: boolean = false;

  constructor(private fb: FormBuilder, private messageService: MessageService, private auth: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      email: [null, [Validators.required, Validators.email]],
      password: [null, Validators.required],
      firstName: [null, Validators.required],
      lastName: [null, Validators.required],
      phone: [null, Validators.required],
      acceptTerms: [false, Validators.requiredTrue]
    })
  }

  register(): void {
    this.submitted = true;
    if (this.registerForm.invalid) return;

    this.loading = true;
    this.registerForm.disable();

    const payload: RegisterRequest = {
      email: this.email.value,
      password: this.password.value,
      firstName: this.firstName.value,
      lastName: this.lastName.value,
      phone: this.phone.value
    };

    this.auth.register(payload)
      .pipe(finalize(() => {
        this.loading = false
        this.registerForm.enable();
      }
      ))
      .subscribe({
        next: (res: ApiResponse<JwtResponse>) => handleAuthSuccess(res, this.auth, this.router),
        error: (e: HttpErrorResponse) => {
          const message = extractErrorMessage(e, 'Ein unbekannter Fehler ist aufgetreten.');
          this.messageService.add({
            key: 'main',
            severity: 'error',
            summary: 'Fehler',
            detail: message
          });
        }
      });
  }

  get email(): AbstractControl {
    return this.registerForm.get('email')!;
  }

  get password(): AbstractControl {
    return this.registerForm.get('password')!;
  }

  get firstName(): AbstractControl {
    return this.registerForm.get('firstName')!;
  }

  get lastName(): AbstractControl {
    return this.registerForm.get('lastName')!;
  }

  get phone(): AbstractControl {
    return this.registerForm.get('phone')!;
  }

  get acceptTerms(): AbstractControl {
    return this.registerForm.get('acceptTerms')!;
  }
}
