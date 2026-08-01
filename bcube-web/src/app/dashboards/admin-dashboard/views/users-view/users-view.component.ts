import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { UserService } from '../../../../services/user.service';
import { User } from '../../../../models/User';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { UpdateUserComponent } from './update-user/update-user.component';
import { DeleteUserComponent } from './delete-user/delete-user.component';
import { LoadingSpinnerComponent } from '../../../../shared/loading-spinner/loading-spinner.component';
import { CommonModule } from '@angular/common';
import { UsersComponent } from '../../components/users/users.component';
import { LIGHT_BUTTON_STYLE } from '../../../../shared/button-style';

@Component({
  selector: 'app-users-view',
  standalone: true,
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