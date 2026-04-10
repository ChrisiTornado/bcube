import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/User';
import { environment } from '../../environments/environment.local';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiResponse } from '../models/responses/ApiResponse';
import { finalize } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { Booking } from '../models/Booking';
import { CreateBookingRequest } from '../models/requests/booking/CreateBookingRequest';
import { BookingResponse } from '../models/responses/booking/BookingResponse';
import { Studio } from '../models/Studio';
import { PageResponse } from '../models/responses/PageResponse';
import { BookingDetailsResponse } from '../models/responses/booking/BookingDetailsResponse';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  private bookingSubject = new BehaviorSubject<Booking[]>([]);
  public bookings$ = this.bookingSubject.asObservable();
  viewMode: 'ADMIN' | 'USER' = 'ADMIN';
  page = 0;
  size = 10;
  userId?: number;

  constructor(private http: HttpClient) { }

  getBookings(
    page: number = 0,
    size: number = 10,
    userId?: number,
    studioId?: number
  ): Observable<PageResponse<Booking>> {

    this.loadingSubject.next(true);

    const params: any = {
      page,
      size
    };

    if (userId != null) {
      params.userId = userId;
    }

    if (studioId != null) {
      params.studioId = studioId;
    }

    return this.http
      .get<ApiResponse<PageResponse<Booking>>>(
        `${environment.bookingApiUrl}`,
        { params }
      )
      .pipe(
        map(res => res.data),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  getBookingsByUserId(
    userId: number,
    page: number = 0,
    size: number = 10,
    stuioId?: number
  ): Observable<PageResponse<Booking>> {
    this.loadingSubject.next(true);

    const params: any = {
      userId,
      page,
      size
    };

    if (stuioId != null) {
      params.studioId = stuioId;
    }

    return this.http
      .get<ApiResponse<PageResponse<Booking>>>(
        `${environment.bookingApiUrl}/user/${userId}`,
        { params }
      )
      .pipe(
        map(res => res.data),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  getBookingsByStudioId(studioId: number): Observable<Booking[]> {
    this.loadingSubject.next(true);
    return this.http
      .get<{ message: string; data: Booking[] }>(`${environment.bookingApiUrl}/studio/${studioId}`)
      .pipe(
        map(res => res.data),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  getBookingById(bookingId: number): Observable<BookingDetailsResponse> {
    this.loadingSubject.next(true);
    return this.http
      .get<{ message: string; data: BookingDetailsResponse }>(`${environment.bookingApiUrl}/${bookingId}`)
      .pipe(
        map(res => res.data),
        finalize(() => this.loadingSubject.next(false))
      )
  }

  setBookings(bookings: Booking[]): void {
    this.bookingSubject.next(bookings);
  }

  getStudioById(id: number): Observable<Booking> {
    this.loadingSubject.next(true);
    return this.http
      .get<{ message: string; data: Booking }>(`${environment.bookingApiUrl}/${id}`)
      .pipe(
        map(res => res.data),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  reloadBookings(userId?: number,
    studioId?: number): void {
    if (this.viewMode === 'ADMIN') {
      this.getBookings(this.page, this.size, userId, studioId)
        .subscribe(res => this.bookingSubject.next(res.content));
      return;
    }

    if (this.viewMode === 'USER' && this.userId != null) {
      this.getBookingsByUserId(this.userId, this.page, this.size)
        .subscribe(res => this.bookingSubject.next(res.content));
    }
  }

  create(payload: CreateBookingRequest): Observable<ApiResponse<BookingDetailsResponse>> {
    return this.http.post<ApiResponse<BookingDetailsResponse>>(
      environment.bookingApiUrl, payload);
  }

  storno(id: number): Observable<ApiResponse<number>> {
    return this.http.delete<ApiResponse<number>>(
      environment.bookingApiUrl + "/" + id
    )
  }
}