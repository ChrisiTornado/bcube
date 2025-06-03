import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { User } from '../../models/user';
import { AuthContainerComponent } from '../auth-container/auth-container.component';
import { ButtonModule } from "primeng/button";
import { ReactiveFormsModule } from '@angular/forms';
import { MessageService } from "primeng/api";
import { finalize } from "rxjs";
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { RegisterRequest } from '../../models/requests/RegisterRequest';
import { ApiResponse } from '../../models/responses/ApiResponse';
import { JwtResponse } from '../../models/responses/JwtResponse';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [InputTextModule, LoadingSpinnerComponent, CommonModule, RouterModule, AuthContainerComponent, ButtonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading!: boolean;

  constructor(private fb: FormBuilder, private messageService: MessageService, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      email: [null, [Validators.required, Validators.email]],
      password: [null, Validators.required],
      firstName: [null, Validators.required],
      lastName: [null, Validators.required],
      phone: [null, Validators.required]
    })
  }

  register(): void {
    if (this.registerForm.invalid) return;

    this.loading = true;

    const payload: RegisterRequest = {
      email: this.email.value,
      password: this.password.value,
      firstName: this.firstName.value,
      lastName: this.lastName.value,
      phone: this.phone.value
    };

    this.auth.register(payload)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res: ApiResponse<JwtResponse>) => {
          const jwt = res.data;

          const user: User = {
            id: jwt.id,
            email: jwt.email,
            role: jwt.role
          };

          this.auth.storeAuth(jwt.token, user);
          sessionStorage.setItem('loginSuccessMessage', res.message);
          const role = jwt.role;
          this.router.navigate([role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/user']);
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
}
