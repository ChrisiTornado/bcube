import { Component, Input } from '@angular/core';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { UserService } from '../../../../../services/user.service';
import { User } from '../../../../../models/user';

@Component({
  selector: 'app-delete-user',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <p-button icon="pi pi-trash"
              styleClass="p-button-danger"
              [loading]="loading"
              (click)="delete()">
    </p-button>
  `
})
export class DeleteUserComponent {
  @Input() user!: User;
  loading = false;

  constructor(private userService: UserService, private messageService: MessageService) {}

  delete(): void {
    this.loading = true;
    this.userService.deleteUser(this.user.id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res) => {
          this.messageService.add({
            key: 'main',
            severity: 'success',
            summary: 'Erfolg',
            detail: res.message
          });
          this.userService.reloadUsers();
        },
        error: (err) => {
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
