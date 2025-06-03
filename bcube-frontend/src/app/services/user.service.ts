import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/user';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiResponse } from '../models/responses/ApiResponse';
import { finalize } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { UserResponse } from '../models/responses/UserResponse';
import { CreateUserRequest } from '../models/requests/CreateUserRequest';
import { UpdateUserRequest } from '../models/requests/UpdateUserRequest';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$ = this.usersSubject.asObservable();

  constructor(private http: HttpClient) { }

  getAll(): Observable<User[]> {
    this.loadingSubject.next(true);
    return this.http
      .get<{ message: string; data: User[] }>(`${environment.adminApiUrl}get-all-users`)
      .pipe(
        map(res => res.data),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  reloadUsers(): void {
    this.getAll().subscribe(users => this.usersSubject.next(users));
  }

  createUser(payload: CreateUserRequest): Observable<ApiResponse<UserResponse>> {
    console.log(payload)
    return this.http.post<ApiResponse<UserResponse>>(
      environment.adminApiUrl + 'create-user',
      payload
    );
  }

  updateUser(payload: UpdateUserRequest): Observable<ApiResponse<UserResponse>> {
    return this.http.put<ApiResponse<UserResponse>>(
      environment.adminApiUrl + 'update-user/' + payload.id,
      payload
    );
  }

  deleteUser(id: number): Observable<ApiResponse<number>> {
    return this.http.delete<ApiResponse<number>>(
      environment.adminApiUrl + 'delete-user/' + id
    );
  }
}