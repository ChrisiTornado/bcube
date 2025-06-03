import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { studio } from '../models/studio';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { CreateStudioRequest } from '../models/requests/CreateStudioRequest';
import { ApiResponse } from '../models/responses/ApiResponse';
import { StudioResponse } from '../models/responses/StudioResponse';
import { UpdateStudioRequest } from '../models/requests/UpdateStudioRequest';
import { finalize } from 'rxjs/operators';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StudioService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  private studiosSubject = new BehaviorSubject<studio[]>([]);
  public studios$ = this.studiosSubject.asObservable();

  constructor(private http: HttpClient) {}
  
  getAll(): Observable<studio[]> {
  this.loadingSubject.next(true);
  return this.http
    .get<{ message: string; data: studio[] }>(`${environment.apiUrl}get-all-studios`)
    .pipe(
      map(res => res.data),
      finalize(() => this.loadingSubject.next(false))
    );
}

reloadStudios(): void {
  this.getAll().subscribe(studios => this.studiosSubject.next(studios));
}

  create(payload: CreateStudioRequest): Observable<ApiResponse<StudioResponse>> {
      return this.http.post<ApiResponse<StudioResponse>>(
        environment.adminApiUrl + "create-studio", payload);
  }

  update(payload: UpdateStudioRequest): Observable<ApiResponse<StudioResponse>> {
    return this.http.put<ApiResponse<StudioResponse>>(
      environment.adminApiUrl + "update-studio/" + payload.id, payload);
  }

  delete(id: number): Observable<ApiResponse<number>>{
    return this.http.delete<ApiResponse<number>>(
      environment.adminApiUrl + "delete-studio/" + id
    )
  }
}
