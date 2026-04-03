import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AuthService } from '../../../../services/auth/auth.service';
import { UserService } from '../../../../services/user.service';
import { User } from '../../../../models/User';
import { UpdateUserRequest } from '../../../../models/requests/user/UpdateUserRequest';

type ProfileUser = User & {
  createdAt?: string;
};

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [
    CommonModule,
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
  user: ProfileUser | null;
  displayName: string;
  initials: string;
  createdAtLabel: string;
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
    this.user = this.resolveStoredUser();
    this.displayName = this.buildDisplayName(this.user);
    this.initials = this.buildInitials(this.user);
    this.createdAtLabel = this.formatCreatedAt(this.user?.createdAt);

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
        summary: 'Nicht verfuegbar',
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
      isAdmin: this.user.role === 'USER'
    };

    const token: string | null = localStorage.getItem('auth_token');
    this.saving = true;
    this.userService.updateUser(token!, payload)
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: () => {
          this.persistLocalUser(payload);
          this.messageService.add({
            severity: 'success',
            summary: 'Gespeichert',
            detail: 'Deine Profildaten wurden aktualisiert.'
          });
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Fehler',
            detail: error?.error?.message ?? 'Das Profil konnte nicht gespeichert werden.'
          });
        }
      });
  }

  openDeleteAccountDialog(): void {
    if (!this.user?.id) {
      return;
    }

    this.confirmationService.confirm({
      message: 'Moechtest du deinen Account wirklich loeschen? Diese Aktion kann nicht rueckgaengig gemacht werden.',
      header: 'Account loeschen',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Ja, loeschen',
      rejectLabel: 'Abbrechen',
      accept: () => this.deleteAccount()
    });
  }

  openPaymentInfo(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Bald verfuegbar',
      detail: 'Die Zahlungsinformationen werden als naechster Frontend-Baustein vorbereitet.'
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
            summary: 'Account geloescht',
            detail: 'Dein Account wurde entfernt.'
          });
          this.authService.logout();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Fehler',
            detail: error?.error?.message ?? 'Der Account konnte nicht geloescht werden.'
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
            role: this.user?.role ?? loadedUser.role ?? 'USER',
            createdAt: this.user?.createdAt
          };
          this.displayName = this.buildDisplayName(this.user);
          this.initials = this.buildInitials(this.user);
          this.createdAtLabel = this.formatCreatedAt(this.user?.createdAt);
          this.profileForm.patchValue({
            firstName: this.user.firstName || '',
            lastName: this.user.lastName || '',
            email: this.user.email || '',
            phone: this.user.phone || ''
          });
          this.persistLocalUser({
            id: this.user.id,
            email: this.user.email,
            firstName: this.user.firstName || '',
            lastName: this.user.lastName || '',
            phone: this.user.phone || '',
            isAdmin: this.user.role === 'ADMIN'
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

  private resolveStoredUser(): ProfileUser | null {
    const baseUser = this.authService.getUser();

    try {
      const raw = localStorage.getItem('auth_user');
      const parsed = raw ? JSON.parse(raw) : null;

      if (!parsed && !baseUser) {
        return null;
      }

      return {
        ...(baseUser || {}),
        id: parsed?.id ?? baseUser?.id ?? 0,
        email: parsed?.email ?? baseUser?.email ?? '',
        role: parsed?.role ?? baseUser?.role ?? 'USER',
        firstName: parsed?.firstName ?? parsed?.firstname ?? parsed?.first_name ?? baseUser?.firstName ?? '',
        lastName: parsed?.lastName ?? parsed?.lastname ?? parsed?.last_name ?? baseUser?.lastName ?? '',
        phone: parsed?.phone ?? parsed?.phoneNumber ?? parsed?.phone_number ?? parsed?.telephone ?? baseUser?.phone ?? '',
        isAdmin: parsed?.isAdmin ?? parsed?.admin ?? baseUser?.isAdmin ?? (parsed?.role ?? baseUser?.role) === 'ADMIN',
        createdAt: parsed?.createdAt ?? parsed?.created_at ?? parsed?.createdOn ?? parsed?.created_on
      };
    } catch {
      return baseUser ? { ...baseUser } : null;
    }
  }

  private persistLocalUser(payload: UpdateUserRequest): void {
    if (!this.user) {
      return;
    }

    const updatedUser = {
      ...this.user,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone
    };

    this.user = updatedUser;
    this.displayName = this.buildDisplayName(updatedUser);
    this.initials = this.buildInitials(updatedUser);
    localStorage.setItem('auth_user', JSON.stringify(updatedUser));
  }

  private buildDisplayName(user: ProfileUser | null): string {
    if (!user) {
      return 'Dein Profil';
    }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return fullName || user.email;
  }

  private buildInitials(user: ProfileUser | null): string {
    const nameSource = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.email || 'B';
    return nameSource
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  private formatCreatedAt(createdAt?: string): string {
    if (!createdAt) {
      return '--';
    }

    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) {
      return '--';
    }

    return new Intl.DateTimeFormat('de-AT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  }
}
