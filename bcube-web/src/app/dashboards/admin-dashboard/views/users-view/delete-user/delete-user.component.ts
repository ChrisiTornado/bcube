import { Component, Input } from '@angular/core';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { MessageService, ConfirmationService  } from 'primeng/api';
import { UserService } from '../../../../../services/user.service';
import { User } from '../../../../../models/User';
import { ApiResponse } from '../../../../../models/responses/ApiResponse';

@Component({
  selector: 'app-delete-user',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <p-button icon="pi pi-trash"
              styleClass="p-button-danger"
              severity="danger" 
              [loading]="loading"
              (click)="confirmDelete()">
    </p-button>
  `
})
export class DeleteUserComponent {
  @Input() user!: User;
  loading = false;

  constructor(private userService: UserService, private messageService: MessageService, private confirmationService: ConfirmationService) {}

  confirmDelete(): void {
    this.confirmationService.confirm({
      message: `Möchten Sie den Benutzer "${this.user.firstName} ${this.user.lastName}" wirklich löschen?`,
      header: 'Löschen bestätigen',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Ja',
      rejectLabel: 'Abbrechen',
      accept: () => this.delete()
    });
  }

  delete(): void {
    this.loading = true;
    this.userService.deleteUser(this.user.id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res: ApiResponse<number>) => {
          this.messageService.add({
            key: 'main',
            severity: 'success',
            summary: 'Erfolg',
            detail: res.message
          });
          this.userService.reloadUsers();
        },
        error: (err: HttpErrorResponse) => {
          this.messageService.add({
            key: 'main',
            severity: 'error',
            summary: 'Fehler',
            detail: err?.error?.message ?? 'Löschen fehlgeschlagen.'
          });
        }
      });
  }
}
