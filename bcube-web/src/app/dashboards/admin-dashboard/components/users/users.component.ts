import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from '../../../../services/user.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from '../../../../shared/loading-spinner/loading-spinner.component';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CreateUserRequest } from '../../../../models/requests/user/CreateUserRequest';
import { ApiResponse } from '../../../../models/responses/ApiResponse';
import { UserResponse } from '../../../../models/responses/user/UserResponse';
import { DARK_BUTTON_STYLE } from '../../../../shared/button-style';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [InputTextModule, DropdownModule, LoadingSpinnerComponent, CommonModule, DialogModule, TableModule, ButtonModule, ReactiveFormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  readonly darkButtonStyle = DARK_BUTTON_STYLE;

  createForm!: FormGroup;
  visible: boolean = false;
  submitted: boolean = false;
  loading: boolean = false;

  roleOptions = [
    { label: 'Benutzer', value: 'USER' },
    { label: 'Administrator', value: 'ADMIN' }
  ];

  constructor(
    private fb: FormBuilder,
    public userService: UserService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
      this.createForm = this.fb.group({
      firstName: [null, Validators.required],
      lastName: [null, Validators.required],
      email: [null, [Validators.required, Validators.email]],
      phone: [null, Validators.required],
      isAdmin: [false, Validators.required]
    });
  }

  get firstName() { return this.createForm.get('firstName')!; }
  get lastName() { return this.createForm.get('lastName')!; }
  get email() { return this.createForm.get('email')!; }
  get phone() { return this.createForm.get('phone')!; }
  get isAdmin() { return this.createForm.get('isAdmin')!; }

  openDialog(): void {
    this.visible = true;
  }

  closeDialog(): void {
    this.visible = false;
    this.createForm.reset({ role: 'USER' });
    this.submitted = false;
  }

  submit(): void {
    this.submitted = true;
    if (this.createForm.invalid) return;

    this.loading = true;

    const payload: CreateUserRequest = {
      firstName: this.firstName.value,
      lastName: this.lastName.value,
      email: this.email.value,
      phone: this.phone.value,
      isAdmin: this.isAdmin.value
    };

    this.userService.createUser(payload)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res: ApiResponse<UserResponse>) => {
          this.userService.reloadUsers();
          this.closeDialog();
          this.messageService.add({
            key: 'main',
            severity: 'success',
            summary: 'Erfolg',
            detail: 'Benutzer erfolgreich erstellt.'
          });
        },
        error: (e: HttpErrorResponse) => {
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
}