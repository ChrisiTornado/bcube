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

@Component({
  selector: 'app-email-reset',
  standalone: true,
  imports: [CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    ToastModule,
    RippleModule,
    AuthContainerComponent,
    InputTextModule
  ],
  templateUrl: './email-reset.component.html',
  styleUrl: './email-reset.component.css'
})
export class EmailResetComponent {
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
    this.formGroup = this.formBuilder.group({
      email: [null, [Validators.required, Validators.email]]
    })
  }

  submit(): void {
    this.submitted = true;
    if (this.formGroup.invalid) return;

    this.loading = true;

    this.authService
      .resetPassword(this.formGroup.value.email)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response: { email: string }) => {
          this.router
            .navigate(['/auth/enter-code'], {
              queryParams: { data: JSON.stringify(response.email) }
            })
            .then(() => {
              setTimeout(() => {
                this.messageService.add({
                  severity: 'success',
                  summary: 'Erfolgreich',
                  detail: 'E-Mail wurde gesendet.'
                });
              });
            });
        },
        error: (err: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Fehler',
            detail: 'Chill bro, bin schon dabei(❁´◡`❁)'
          });
        }
      });
  }

  goBack(): void {
  this.router.navigate(['/auth/login']);
}

  get email(): AbstractControl {
    return this.formGroup.get('email')!;
  }
}
