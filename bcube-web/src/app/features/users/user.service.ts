import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { User } from '@models/user.model';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '@models/responses/api-response';
import { finalize } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { UserResponse } from '@models/responses/user/user-response';
import { CreateUserRequest } from '@models/requests/user/create-user-request';
import { UpdateUserRequest } from '@models/requests/user/update-user-request';
import { PageResponse } from '@models/responses/page-response';
import { UserNameResponse } from '@models/responses/user/user-name-response';
import { CollectionStore } from '@core/services/collection-store';
import { MessageService } from 'primeng/api';
import { extractErrorMessage } from '@shared/util/error-message.util';

@Injectable({
  providedIn: 'root'
})
export class UserService extends CollectionStore<User> {
  public readonly users$ = this.items$;
  public readonly size = 10;

  private pageValue = 0;

  get page(): number { return this.pageValue; }

  constructor(private http: HttpClient, private messageService: MessageService) {
    super();
  }

  setPage(page: number): void {
    this.pageValue = page;
  }

  getAll(page: number = 0, size: number = 10): Observable<PageResponse<User>> {
    this.setLoading(true);
    return this.http
      .get<ApiResponse<PageResponse<User>>>(`${environment.adminApiUrl}?page=${page}&size=${size}`)
      .pipe(
        map(res => res.data),
        finalize(() => this.setLoading(false))
      );
  }

  reloadUsers(): void {
    this.getAll().subscribe({
      next: users => this.setItems(users.content),
      error: (err: HttpErrorResponse) => {
        this.messageService.add({
          key: 'main',
          severity: 'error',
          summary: 'Fehler',
          detail: extractErrorMessage(err, 'User konnten nicht aktualisiert werden.')
        });
      }
    });
  }

  setUsers(users: User[]): void {
    this.setItems(users);
  }

  createUser(payload: CreateUserRequest): Observable<ApiResponse<UserResponse>> {
    return this.http.post<ApiResponse<UserResponse>>(
      environment.adminApiUrl,
      payload
    );
  }

  getUserFilter(page: number, size: number): Observable<PageResponse<UserNameResponse>> {
    return this.http
      .get<ApiResponse<PageResponse<UserNameResponse>>>(
        `${environment.adminApiUrl}/filters?page=${page}&size=${size}`)
      .pipe(map(res => res.data));
  }

  getById(id: number): Observable<User> {
    return this.http
      .get<ApiResponse<User>>(`${environment.userApiUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  updateUserAsAdmin(payload: UpdateUserRequest): Observable<ApiResponse<UserResponse>> {
    return this.http.put<ApiResponse<UserResponse>>(
      environment.adminApiUrl + '/' + payload.id,
      payload
    );
  }

  updateUser(payload: UpdateUserRequest): Observable<ApiResponse<UserResponse>> {
    return this.http.put<ApiResponse<UserResponse>>(
      environment.userApiUrl + '/me',
      payload
    );
  }

  deleteUser(id: number): Observable<ApiResponse<number>> {
    return this.http.delete<ApiResponse<number>>(
      environment.adminApiUrl + '/' + id
    );
  }
}
