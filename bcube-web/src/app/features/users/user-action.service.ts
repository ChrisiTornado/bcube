import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ConfirmationService, MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { UserService } from '@features/users/user.service';
import { User } from '@models/user.model';
import { ApiResponse } from '@models/responses/api-response';
import { extractErrorMessage } from '@shared/util/error-message.util';

/** Shared confirm-then-delete-user flow, reused wherever a user can be deleted. */
@Injectable({
  providedIn: 'root'
})
export class UserActionService {
  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private userService: UserService
  ) { }

  confirmDelete(user: User, setLoading?: (loading: boolean) => void): void {
    this.confirmationService.confirm({
      message: `Möchten Sie den Benutzer "${user.firstName} ${user.lastName}" wirklich löschen?`,
      header: 'Löschen bestätigen',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Ja',
      rejectLabel: 'Abbrechen',
      accept: () => this.executeDelete(user, setLoading)
    });
  }

  private executeDelete(user: User, setLoading?: (loading: boolean) => void): void {
    setLoading?.(true);

    this.userService.deleteUser(user.id)
      .pipe(finalize(() => setLoading?.(false)))
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
            detail: extractErrorMessage(err, 'Löschen fehlgeschlagen.')
          });
        }
      });
  }
}
