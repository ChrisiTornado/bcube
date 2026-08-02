import { Component, Input } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { User } from '@models/user.model';
import { UserActionService } from '@features/users/user-action.service';

@Component({
    selector: 'app-delete-user',
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

  constructor(private userActionService: UserActionService) {}

  confirmDelete(): void {
    this.userActionService.confirmDelete(this.user, loading => this.loading = loading);
  }
}
