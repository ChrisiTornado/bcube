import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { UserService } from '../../../../../services/user.service';
import { MessageService } from 'primeng/api';
import { User } from '../../../../../models/user';
import { UpdateUserRequest } from '../../../../../models/requests/UpdateUserRequest';
import { ApiResponse } from '../../../../../models/responses/ApiResponse';
import { UserResponse } from '../../../../../models/responses/UserResponse';

@Component({
  selector: 'app-update-user',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    ReactiveFormsModule
  ],
  templateUrl: './update-user.component.html',
  styleUrl: './update-user.component.css'
})
export class UpdateUserComponent implements OnInit {
  @Input() user!: User;

  updateForm!: FormGroup;
  visible: boolean = false;
  submitted: boolean = false;
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.updateForm = this.fb.group({
      firstName: [this.user.firstName, Validators.required],
      lastName: [this.user.lastName, Validators.required],
      email: [this.user.email, [Validators.required, Validators.email]],
      phone: [this.user.phone, Validators.required],
      isAdmin: [this.user.isAdmin, Validators.required]
    });
  }

  openDialog(): void {
    this.visible = true;
  }

  closeDialog(): void {
    this.visible = false;
    this.submitted = false;
    this.updateForm.patchValue({
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      email: this.user.email,
      phone: this.user.phone,
      isAdmin: this.user.isAdmin
    });
  }

  submit(): void {
    this.submitted = true;
    if (this.updateForm.invalid) return;
    this.loading = true;

    const payload: UpdateUserRequest = {
      id: this.user.id,
      firstName: this.firstName.value,
      lastName: this.lastName.value,
      email: this.email.value,
      phone: this.phone.value,
      isAdmin: this.isAdmin.value
    };

    this.userService.updateUser(payload)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res: ApiResponse<UserResponse>) => {
          this.userService.reloadUsers();
          this.messageService.add({ severity: 'success', summary: 'Erfolgreich', detail: res.message });
          this.closeDialog();
        },
        error: (e: any) => {
          const message = e?.error?.message ?? 'Ein unbekannter Fehler ist aufgetreten.';
          this.messageService.add({ severity: 'error', summary: 'Fehler', detail: message });
        }
      });
  }

  // Getter für FormControls
  get firstName() { return this.updateForm.get('firstName')!; }
  get lastName() { return this.updateForm.get('lastName')!; }
  get email() { return this.updateForm.get('email')!; }
  get phone() { return this.updateForm.get('phone')!; }
  get isAdmin() { return this.updateForm.get('isAdmin')!; }
}