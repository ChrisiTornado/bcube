import { Component, OnInit } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@features/users/user.service';
import { User } from '@models/user.model';
import { UpdateUserRequest } from '@models/requests/user/update-user-request';
import { extractErrorMessage } from '@shared/util/error-message.util';

@Component({
    selector: 'app-profile-view',
    imports: [
    RouterModule,
    ReactiveFormsModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    InputTextModule
],
    templateUrl: './profile-view.component.html',
    styleUrl: './profile-view.component.css',
    providers: [MessageService, ConfirmationService]
})
export class ProfileViewComponent implements OnInit {
  user: User | null;
  displayName: string;
  initials: string;
  readonly profileForm: FormGroup;

  saving = false;
  deleting = false;
  loading = true;

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly router: Router,
    private readonly formBuilder: FormBuilder,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService
  ) {
    this.user = this.authService.resolveStoredUser();
    this.displayName = this.buildDisplayName(this.user);
    this.initials = this.buildInitials(this.user);

    this.profileForm = this.formBuilder.group({
      firstName: [this.user?.firstName || '', Validators.required],
      lastName: [this.user?.lastName || '', Validators.required],
      email: [this.user?.email || '', [Validators.required, Validators.email]],
      phone: [this.user?.phone || '', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  goToPasswordFlow(): void {
    this.router.navigate(['/auth/email-reset'], {
      state: { returnUrl: this.router.url }
    });
  }

  saveProfile(): void {
    if (!this.user?.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Nicht verfügbar',
        detail: 'Das Profil konnte nicht eindeutig geladen werden.'
      });
      return;
    }

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const payload: UpdateUserRequest = {
      id: this.user.id,
      email: this.profileForm.value.email,
      firstName: this.profileForm.value.firstName,
      lastName: this.profileForm.value.lastName,
      phone: this.profileForm.value.phone,
      isAdmin: this.authService.isAdmin(this.user)
    };

    if (!this.authService.isAuthenticated()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Fehler',
        detail: 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.'
      });
      return;
    }

    this.saving = true;
    this.userService.updateUser(payload)
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: () => {
          this.applyUserPatch({
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            phone: payload.phone
          });
          this.messageService.add({
            severity: 'success',
            summary: 'Gespeichert',
            detail: 'Deine Profildaten wurden aktualisiert.'
          });
        },
        error: (error: HttpErrorResponse) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Fehler',
            detail: extractErrorMessage(error, 'Das Profil konnte nicht gespeichert werden.')
          });
        }
      });
  }

  openDeleteAccountDialog(): void {
    if (!this.user?.id) {
      return;
    }

    this.confirmationService.confirm({
      message: 'Möchtest du deinen Account wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
      header: 'Account löschen',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Ja, löschen',
      rejectLabel: 'Abbrechen',
      accept: () => this.deleteAccount()
    });
  }

  openPaymentInfo(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Bald verfügbar',
      detail: 'Die Zahlungsinformationen werden als nächster Frontend-Baustein vorbereitet.'
    });
  }

  openLogoutDialog(): void {
    this.confirmationService.confirm({
      message: 'Möchtest du dich wirklich ausloggen?',
      header: 'Logout bestätigen',
      icon: 'pi pi-sign-out',
      acceptLabel: 'Ja, ausloggen',
      rejectLabel: 'Abbrechen',
      accept: () => this.authService.logout()
    });
  }

  private deleteAccount(): void {
    if (!this.user?.id) {
      return;
    }

    this.deleting = true;
    this.userService.deleteUser(this.user.id)
      .pipe(finalize(() => this.deleting = false))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Account gelöscht',
            detail: 'Dein Account wurde entfernt.'
          });
          this.authService.logout();
        },
        error: (error: HttpErrorResponse) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Fehler',
            detail: extractErrorMessage(error, 'Der Account konnte nicht gelöscht werden.')
          });
        }
      });
  }

  private loadProfile(): void {
    if (!this.user?.id) {
      this.loading = false;
      return;
    }

    this.userService.getById(this.user.id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (loadedUser) => {
          this.user = {
            ...this.user,
            ...loadedUser,
            role: this.user?.role ?? loadedUser.role ?? 'USER'
          };
          this.displayName = this.buildDisplayName(this.user);
          this.initials = this.buildInitials(this.user);
          this.profileForm.patchValue({
            firstName: this.user.firstName || '',
            lastName: this.user.lastName || '',
            email: this.user.email || '',
            phone: this.user.phone || ''
          });
          this.applyUserPatch({
            email: this.user.email,
            firstName: this.user.firstName || '',
            lastName: this.user.lastName || '',
            phone: this.user.phone || ''
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'warn',
            summary: 'Profil nur lokal geladen',
            detail: 'Einige Profildaten konnten nicht frisch geladen werden.'
          });
        }
      });
  }

  /** Applies a partial profile update to both component state and persisted storage. */
  private applyUserPatch(patch: Partial<User>): void {
    const updatedUser = this.authService.persistUserUpdate(patch);
    if (!updatedUser) {
      return;
    }

    this.user = updatedUser;
    this.displayName = this.buildDisplayName(updatedUser);
    this.initials = this.buildInitials(updatedUser);
  }

  private buildDisplayName(user: User | null): string {
    if (!user) {
      return 'Dein Profil';
    }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return fullName || user.email;
  }

  private buildInitials(user: User | null): string {
    const nameSource = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.email || 'B';
    return nameSource
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() ?? '')
      .join('');
  }
}
