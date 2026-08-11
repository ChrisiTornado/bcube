import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { UserService } from '@features/users/user.service';
import { MessageService } from 'primeng/api';
import { User } from '@models/user.model';
import { UpdateUserRequest } from '@models/requests/user/update-user-request';
import { ApiResponse } from '@models/responses/api-response';
import { UserResponse } from '@models/responses/user/user-response';
import { DARK_BUTTON_STYLE } from '@shared/util/button-style';
import { extractErrorMessage } from '@shared/util/error-message.util';
import { buildUserForm } from '@features/users/shared/user-form.util';
import { UserFormFieldsComponent } from '@features/users/shared/user-form-fields/user-form-fields.component';

@Component({
    selector: 'app-update-user',
    imports: [
    DialogModule,
    ButtonModule,
    ReactiveFormsModule,
    UserFormFieldsComponent
],
    templateUrl: './update-user.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './update-user.component.css'
})
export class UpdateUserComponent implements OnInit {
  @Input() user!: User;

  readonly darkButtonStyle = DARK_BUTTON_STYLE;

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
    this.updateForm = buildUserForm(this.fb, this.user);
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

    this.userService.updateUserAsAdmin(payload)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res: ApiResponse<UserResponse>) => {
          this.userService.reloadUsers();
          this.messageService.add({ severity: 'success', summary: 'Erfolgreich', detail: res.message });
          this.closeDialog();
        },
        error: (e: HttpErrorResponse) => {
          const message = extractErrorMessage(e, 'Ein unbekannter Fehler ist aufgetreten.');
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