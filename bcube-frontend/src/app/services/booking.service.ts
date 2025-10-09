import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/user';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiResponse } from '../models/responses/ApiResponse';
import { finalize } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { booking } from '../models/booking';
import { CreateBookingRequest } from '../models/requests/CreateBookingRequest';
import { BookingResponse } from '../models/responses/BookingResponse';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  private bookingSubject = new BehaviorSubject<booking[]>([]);
  public bookings$ = this.bookingSubject.asObservable();

  constructor(private http: HttpClient) { }

  getAll(): Observable<booking[]> {
    this.loadingSubject.next(true);
    return this.http
      .get<{ message: string; data: booking[] }>(`${environment.bookingApiUrl}/bookings`)
      .pipe(
        map(res => res.data),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  getBookingsByUserId(userId: number): Observable<booking[]> {
    this.loadingSubject.next(true);
    return this.http
      .get<{ message: string; data: booking[] }>(`${environment.bookingApiUrl}/bookings/user/${userId}`)
      .pipe(
        map(res => res.data),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  getBookingsByStudioId(studioId: number): Observable<booking[]> {
    this.loadingSubject.next(true);
    return this.http
      .get<{ message: string; data: booking[] }>(`${environment.bookingApiUrl}/bookings/studio/${studioId}`)
      .pipe(
        map(res => res.data),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  getBookingById(bookingId: number): Observable<booking> {
    this.loadingSubject.next(true);
    return this.http
      .get<{ message: string; data:booking }>(`${environment.bookingApiUrl}/bookings/${bookingId}`)
      .pipe(
        map(res => res.data),
        finalize(() => this.loadingSubject.next(false))
      )
  }

  setBookings(bookings: booking[]): void {
    this.bookingSubject.next(bookings);
  }

  getStudioById(id: number): Observable<booking> {
    this.loadingSubject.next(true);
    return this.http
      .get<{ message: string; data: booking }>(`${environment.bookingApiUrl}/${id}`)
      .pipe(
        map(res => res.data),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  reloadBookings(): void {
    this.getAll().subscribe(bookings => this.bookingSubject.next(bookings));
  }

  create(payload: CreateBookingRequest): Observable<ApiResponse<BookingResponse>> {
    console.log(payload)
    return this.http.post<ApiResponse<BookingResponse>>(
      environment.bookingApiUrl + "/bookings", payload);
  }

  storno(id: number): Observable<ApiResponse<number>>{
    return this.http.delete<ApiResponse<number>>(
      environment.bookingApiUrl + "/bookings" + id
    )
  }
}
