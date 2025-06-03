import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { User } from '../../models/user';
import { ButtonModule } from "primeng/button";
import { finalize } from "rxjs";
import { AuthContainerComponent } from '../auth-container/auth-container.component';
import { ReactiveFormsModule } from '@angular/forms';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { ApiResponse } from '../../models/responses/ApiResponse';
import { JwtResponse } from '../../models/responses/JwtResponse';
import { LoginRequest } from '../../models/requests/LoginRequest';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [LoadingSpinnerComponent, CommonModule, RouterModule, ButtonModule, AuthContainerComponent, ReactiveFormsModule, ToastModule, InputTextModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading!: boolean;

  constructor(private fb: FormBuilder, private messageService: MessageService, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: [null, [Validators.required, Validators.email]],
      password: [null, Validators.required]
    })
    // if(this.auth.user?.passwordReset)
    //   this.email.setValue(this.auth.user.email)
  }

  login(): void {
    if (this.loginForm.invalid) return;

    this.loading = true;

    const payload: LoginRequest = {
      email: this.email.value,
      password: this.password.value
    };

    this.auth.login(payload)
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
          this.router.navigate([role === 'ADMIN' ? '/admin-dashboard/studios' : '/user-dashboard/studios']);
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
    return this.loginForm.get('email')!;
  }

  get password(): AbstractControl {
    return this.loginForm.get('password')!;
  }
}