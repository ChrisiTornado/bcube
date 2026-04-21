import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import { environment } from '../../environments/environment.local';
import { Studio } from '../models/Studio';
import { CreateStudioRequest } from '../models/requests/studio/CreateStudioRequest';
import { UpdateStudioRequest } from '../models/requests/studio/UpdateStudioRequest';
import { ApiResponse } from '../models/responses/ApiResponse';
import { StudioResponse } from '../models/responses/studio/StudioResponse';
import { PageResponse } from '../models/responses/PageResponse';
import { StudioNameResponse } from '../models/responses/studio/StudioNameResponse';

@Injectable({
  providedIn: 'root'
})
export class StudioService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private studiosSubject = new BehaviorSubject<Studio[]>([]);
  public studios$ = this.studiosSubject.asObservable();

  public page = 0;
  public size = 10;

  constructor(private http: HttpClient) {
    this.reloadStudios();
  }

  getAllStudios(): Observable<Studio[]> {
    this.loadingSubject.next(true);
    return this.http
      .get<ApiResponse<Studio[]>>(environment.studioApiUrl)
      .pipe(
        map(res => res.data),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  getStudiosPagination(page: number = 0, size: number = 10): Observable<PageResponse<Studio>> {
    this.loadingSubject.next(true);

    return this.http
      .get<ApiResponse<PageResponse<Studio>>>(
        `${environment.studioApiUrl}/page?page=${page}&size=${size}`
      )
      .pipe(
        map(res => res.data),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  getStudioById(id: number): Observable<Studio> {
    this.loadingSubject.next(true);
    return this.http
      .get<ApiResponse<Studio>>(`${environment.studioApiUrl}/${id}`)
      .pipe(
        map(res => res.data),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  reloadStudios(page: number = 0, size: number = 10): void {
    this.getStudiosPagination(page, size).subscribe(pageResponse => {
      this.studiosSubject.next(pageResponse.content);
    });
  }

  getStudioFilter(page: number, size: number): Observable<PageResponse<StudioNameResponse>> {
    return this.http
      .get<ApiResponse<PageResponse<StudioNameResponse>>>(
        `${environment.studioApiUrl}/filters?page=${page}&size=${size}`
      )
      .pipe(map(res => res.data));
  }

  setStudios(studios: Studio[]): void {
    this.studiosSubject.next(studios);
  }

  get currentStudios(): Studio[] {
    return this.studiosSubject.getValue();
  }

  create(payload: CreateStudioRequest): Observable<ApiResponse<StudioResponse>> {
    return this.http.post<ApiResponse<StudioResponse>>(
      environment.adminStudioApiUrl,
      payload
    );
  }

  moveStudioToTop(studio: Studio): void {
    const studios = [...this.studiosSubject.getValue()];
    const index = studios.findIndex(s => s.id === studio.id);

    if (index > -1) {
      const [selected] = studios.splice(index, 1);
      studios.unshift(selected);
      this.studiosSubject.next(studios);
    }
  }

  update(payload: UpdateStudioRequest): Observable<ApiResponse<StudioResponse>> {
    return this.http.put<ApiResponse<StudioResponse>>(
      `${environment.adminStudioApiUrl}/${payload.id}`,
      payload
    );
  }

  delete(id: number): Observable<ApiResponse<number>> {
    return this.http.delete<ApiResponse<number>>(
      `${environment.adminStudioApiUrl}/${id}`
    );
  }
}