import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from '@features/users/user.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

import { CreateUserRequest } from '@models/requests/user/create-user-request';
import { DARK_BUTTON_STYLE } from '@shared/util/button-style';
import { extractErrorMessage } from '@shared/util/error-message.util';
import { buildUserForm } from '@features/users/shared/user-form.util';
import { UserFormFieldsComponent } from '@features/users/shared/user-form-fields/user-form-fields.component';

@Component({
    selector: 'app-create-user',
    imports: [DialogModule, TableModule, ButtonModule, ReactiveFormsModule, UserFormFieldsComponent],
    templateUrl: './create-user.component.html'
})
export class CreateUserComponent implements OnInit {
  readonly darkButtonStyle = DARK_BUTTON_STYLE;

  createForm!: FormGroup;
  visible: boolean = false;
  submitted: boolean = false;
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    public userService: UserService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.createForm = buildUserForm(this.fb);
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
        next: () => {
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
}