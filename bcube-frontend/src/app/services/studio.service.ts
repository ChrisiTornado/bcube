import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { studio } from '../models/studio';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { CreateStudioRequest } from '../models/requests/CreateStudioRequest';
import { ApiResponse } from '../models/responses/ApiResponse';
import { StudioResponse } from '../models/responses/StudioResponse';
import { UpdateStudioRequest } from '../models/requests/UpdateStudioRequest';
import { finalize, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StudioService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private studiosSubject = new BehaviorSubject<studio[]>([]);
  public studios$ = this.studiosSubject.asObservable();

  constructor(private http: HttpClient) {
    // direkt beim Service-Init alle Studios laden
    this.reloadStudios();
  }

  getAll(): Observable<studio[]> {
    this.loadingSubject.next(true);
    return this.http
      .get<{ message: string; data: studio[] }>(`${environment.apiUrl}get-all-studios`)
      .pipe(
        map(res => res.data),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  getStudioById(id: number): Observable<studio> {
    this.loadingSubject.next(true);
    return this.http
      .get<{ message: string; data: studio }>(`${environment.apiUrl}get-studio-by-id/${id}`)
      .pipe(
        map(res => res.data),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  reloadStudios(): void {
    this.getAll().subscribe(studios => this.studiosSubject.next(studios));
  }

  get currentStudios(): studio[] {
  return this.studiosSubject.getValue();
}

  create(payload: CreateStudioRequest): Observable<ApiResponse<StudioResponse>> {
    return this.http.post<ApiResponse<StudioResponse>>(
      environment.adminApiUrl + 'create-studio',
      payload
    );
  }

  moveStudioToTop(studio: studio): void {
  const studios = [...this.studiosSubject.getValue()]; // aktuelle Liste kopieren
  const index = studios.findIndex(s => s.id === studio.id);
  if (index > -1) {
    // Entferne Studio von seiner Position
    const [selected] = studios.splice(index, 1);
    // Ganz oben wieder einfügen
    studios.unshift(selected);
    // Liste neu setzen
    this.studiosSubject.next(studios);
  }
}

  update(payload: UpdateStudioRequest): Observable<ApiResponse<StudioResponse>> {
    return this.http.put<ApiResponse<StudioResponse>>(
      environment.adminApiUrl + 'update-studio/' + payload.id,
      payload
    );
  }

  delete(id: number): Observable<ApiResponse<number>> {
    return this.http.delete<ApiResponse<number>>(
      environment.adminApiUrl + 'delete-studio/' + id
    );
  }
}