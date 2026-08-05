import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { MessageService } from 'primeng/api';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { User } from '@models/user.model';
import { UpdateUserRequest } from '@models/requests/user/update-user-request';
import { UserService } from '@features/users/user.service';
import { AuthService } from '@core/services/auth.service';
import { DARK_BUTTON_STYLE } from '@shared/util/button-style';
import { extractErrorMessage } from '@shared/util/error-message.util';

/**
 * Shown right after a Google sign-in that came back missing required fields (Google never
 * hands over a phone number, and occasionally no given/family name). Mandatory and
 * non-dismissible - the account isn't usable app-wide without these - pre-filled with
 * whatever Google did provide so the user only has to fill the gaps.
 */
@Component({
  selector: 'app-complete-profile-dialog',
  imports: [DialogModule, ReactiveFormsModule, ButtonModule, InputTextModule, RippleModule],
  templateUrl: './complete-profile-dialog.component.html',
  styleUrl: './complete-profile-dialog.component.css'
})
export class CompleteProfileDialogComponent implements OnInit {
  @Input({ required: true }) user!: User;
  @Output() completed = new EventEmitter<User>();

  readonly darkButtonStyle = DARK_BUTTON_STYLE;

  form!: FormGroup;
  loading = false;
  submitted = false;

  needsFirstName = false;
  needsLastName = false;
  needsPhone = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.needsFirstName = !this.user.firstName;
    this.needsLastName = !this.user.lastName;
    this.needsPhone = !this.user.phone;

    this.form = this.fb.group({
      email: [this.user.email ?? null],
      firstName: [this.user.firstName ?? null, this.needsFirstName ? [Validators.required] : []],
      lastName: [this.user.lastName ?? null, this.needsLastName ? [Validators.required] : []],
      phone: [this.user.phone ?? null, this.needsPhone ? [Validators.required] : []]
    });
  }

  submit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    this.loading = true;

    const payload: UpdateUserRequest = {
      id: this.user.id,
      email: this.user.email,
      isAdmin: this.authService.isAdmin(this.user),
      firstName: this.firstName.value,
      lastName: this.lastName.value,
      phone: this.phone.value
    };

    this.userService.updateUser(payload)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res) => {
          const updated = this.authService.persistUserUpdate({
            firstName: res.data.firstName,
            lastName: res.data.lastName,
            phone: res.data.phone
          });
          this.completed.emit(updated ?? this.user);
        },
        error: (e: HttpErrorResponse) => {
          this.messageService.add({
            key: 'main',
            severity: 'error',
            summary: 'Fehler',
            detail: extractErrorMessage(e, 'Profil konnte nicht gespeichert werden.')
          });
        }
      });
  }

  get firstName(): AbstractControl {
    return this.form.get('firstName')!;
  }

  get lastName(): AbstractControl {
    return this.form.get('lastName')!;
  }

  get phone(): AbstractControl {
    return this.form.get('phone')!;
  }
}
