import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { UserService } from '../../../../services/user.service';
import { User } from '../../../../models/user';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { UpdateUserComponent } from './update-user/update-user.component';
import { DeleteUserComponent } from './delete-user/delete-user.component';
import { LoadingSpinnerComponent } from '../../../../shared/loading-spinner/loading-spinner.component';
import { CommonModule } from '@angular/common';
import { UsersComponent } from '../../components/users/users.component';

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
  users$!: Observable<User[]>;
  loading$ = this.userService.loading$;

  constructor(private userService: UserService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.users$ = this.userService.users$;
    this.userService.reloadUsers();
  }

  navigateToDetails(user: User) {
    const navigationUrl = ['/admin/user-details', user.id];
    this.router.navigate(navigationUrl, {
      queryParams: { user: JSON.stringify(user) }
    });
  }
}