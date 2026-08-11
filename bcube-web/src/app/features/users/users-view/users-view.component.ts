import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { UserService } from '@features/users/user.service';
import { User } from '@models/user.model';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { HttpErrorResponse } from '@angular/common/http';
import { UpdateUserComponent } from '@features/users/users-view/update-user/update-user.component';
import { DeleteUserComponent } from '@features/users/users-view/delete-user/delete-user.component';
import { LoadingSpinnerComponent } from '@shared/ui/loading-spinner/loading-spinner.component';
import { CommonModule } from '@angular/common';
import { LIGHT_BUTTON_STYLE } from '@shared/util/button-style';
import { extractErrorMessage } from '@shared/util/error-message.util';

@Component({
    selector: 'app-users-view',
    imports: [
        CommonModule,
        LoadingSpinnerComponent,
        TableModule,
        ButtonModule,
        UpdateUserComponent,
        DeleteUserComponent
    ],
    templateUrl: './users-view.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './users-view.component.css'
})
export class UsersViewComponent implements OnInit {
  readonly lightButtonStyle = LIGHT_BUTTON_STYLE;

  users$!: Observable<User[]>;
  loading$ = this.userService.loading$;
  totalPages = 0;

  constructor(public userService: UserService, private messageService: MessageService) { }

  ngOnInit(): void {
    this.users$ = this.userService.users$;
    this.loadPage(0);
  }

  loadPage(page: number) {
    this.userService.setPage(page);
    this.userService.getAll(page, this.userService.size)
    .subscribe({
      next: (res) => {
        this.totalPages = res.totalPages;
        this.userService.setUsers(res.content);
      },
      error: (err: HttpErrorResponse) => {
        this.messageService.add({
          key: 'main',
          severity: 'error',
          summary: 'Fehler',
          detail: extractErrorMessage(err, 'User konnten nicht geladen werden.')
        });
      }
    });
  }
}