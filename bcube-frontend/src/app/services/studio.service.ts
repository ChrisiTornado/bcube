import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Studio } from '../models/Studio';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { CreateStudioRequest } from '../models/requests/studio/CreateStudioRequest';
import { ApiResponse } from '../models/responses/ApiResponse';
import { StudioResponse } from '../models/responses/studio/StudioResponse';
import { UpdateStudioRequest } from '../models/requests/studio/UpdateStudioRequest';
import { finalize, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StudioService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private studiosSubject = new BehaviorSubject<Studio[]>([]);
  public studios$ = this.studiosSubject.asObservable();

  constructor(private http: HttpClient) {
    // direkt beim Service-Init alle Studios laden
    this.reloadStudios();
  }

  getAll(): Observable<Studio[]> {
    this.loadingSubject.next(true);
    return this.http
      .get<{ message: string; data: Studio[] }>(`${environment.studioApiUrl}/studios`)
      .pipe(
        map(res => res.data),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  getStudioById(id: number): Observable<Studio> {
    this.loadingSubject.next(true);
    return this.http
      .get<{ message: string; data: Studio }>(`${environment.studioApiUrl}/studios/${id}`)
      .pipe(
        map(res => res.data),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  reloadStudios(): void {
    this.getAll().subscribe(studios => this.studiosSubject.next(studios));
  }

  get currentStudios(): Studio[] {
  return this.studiosSubject.getValue();
}

  create(payload: CreateStudioRequest): Observable<ApiResponse<StudioResponse>> {
    return this.http.post<ApiResponse<StudioResponse>>(
      environment.studioApiUrl + '/admin/studios',
      payload
    );
  }

  moveStudioToTop(studio: Studio): void {
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
      environment.studioApiUrl + '/admin/studios/' + payload.id,
      payload
    );
  }

  delete(id: number): Observable<ApiResponse<number>> {
    return this.http.delete<ApiResponse<number>>(
      environment.studioApiUrl + '/admin/studios/' + id
    );
  }
}