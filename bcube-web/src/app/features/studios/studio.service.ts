import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import { environment } from '@environments/environment.local';
import { Studio } from '@models/studio.model';
import { CreateStudioRequest } from '@models/requests/studio/create-studio-request';
import { UpdateStudioRequest } from '@models/requests/studio/update-studio-request';
import { ApiResponse } from '@models/responses/api-response';
import { StudioResponse } from '@models/responses/studio/studio-response';
import { PageResponse } from '@models/responses/page-response';
import { StudioNameResponse } from '@models/responses/studio/studio-name-response';
import { CollectionStore } from '@core/services/collection-store';

@Injectable({
  providedIn: 'root'
})
export class StudioService extends CollectionStore<Studio> {
  public readonly studios$ = this.items$;

  public page = 0;
  public size = 10;

  constructor(private http: HttpClient) {
    super();
    this.reloadStudios();
  }

  getAllStudios(): Observable<Studio[]> {
    this.setLoading(true);
    return this.http
      .get<ApiResponse<Studio[]>>(environment.studioApiUrl)
      .pipe(
        map(res => res.data),
        finalize(() => this.setLoading(false))
      );
  }

  getStudiosPagination(page: number = 0, size: number = 10): Observable<PageResponse<Studio>> {
    this.setLoading(true);

    return this.http
      .get<ApiResponse<PageResponse<Studio>>>(
        `${environment.studioApiUrl}/page?page=${page}&size=${size}`
      )
      .pipe(
        map(res => res.data),
        finalize(() => this.setLoading(false))
      );
  }

  getStudioById(id: number): Observable<Studio> {
    this.setLoading(true);
    return this.http
      .get<ApiResponse<Studio>>(`${environment.studioApiUrl}/${id}`)
      .pipe(
        map(res => res.data),
        finalize(() => this.setLoading(false))
      );
  }

  reloadStudios(page: number = 0, size: number = 10): void {
    this.getStudiosPagination(page, size).subscribe(pageResponse => {
      this.setItems(pageResponse.content);
    });
  }

  reloadAllStudios(): void {
    this.getAllStudios().subscribe(studios => {
      this.setItems(studios);
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
    this.setItems(studios);
  }

  get currentStudios(): Studio[] {
    return this.currentItems;
  }

  create(payload: CreateStudioRequest): Observable<ApiResponse<StudioResponse>> {
    return this.http.post<ApiResponse<StudioResponse>>(
      environment.adminStudioApiUrl,
      payload
    );
  }

  moveStudioToTop(studio: Studio): void {
    const studios = [...this.currentItems];
    const index = studios.findIndex(s => s.id === studio.id);

    if (index > -1) {
      const [selected] = studios.splice(index, 1);
      studios.unshift(selected);
      this.setItems(studios);
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
