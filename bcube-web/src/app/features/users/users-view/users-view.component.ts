import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { UserService } from '@features/users/user.service';
import { User } from '@models/user.model';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { UpdateUserComponent } from '@features/users/users-view/update-user/update-user.component';
import { DeleteUserComponent } from '@features/users/users-view/delete-user/delete-user.component';
import { LoadingSpinnerComponent } from '@shared/ui/loading-spinner/loading-spinner.component';
import { CommonModule } from '@angular/common';
import { UsersComponent } from '@features/users/create-user/users.component';
import { LIGHT_BUTTON_STYLE } from '@shared/util/button-style';

@Component({
    selector: 'app-users-view',
    imports: [
        UsersComponent,
        CommonModule,
        LoadingSpinnerComponent,
        TableModule,
        ButtonModule,
        UpdateUserComponent,
        DeleteUserComponent
    ],
    templateUrl: './users-view.component.html',
    styleUrl: './users-view.component.css'
})
export class UsersViewComponent implements OnInit {
  readonly lightButtonStyle = LIGHT_BUTTON_STYLE;

  users$!: Observable<User[]>;
  loading$ = this.userService.loading$;
  totalPages = 0;

  constructor(public userService: UserService) { }

  ngOnInit(): void {
    this.users$ = this.userService.users$;
    this.loadPage(0);
  }

  loadPage(page: number) {
    this.userService.page = page;
    this.userService.getAll(page, this.userService.size)
    .subscribe(res => {
        this.totalPages = res.totalPages;
        this.userService.setUsers(res.content);
    })
  }
}