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
      .get<{ message: string; data: booking[] }>(`${environment.apiUrl}get-all-bookings`)
      .pipe(
        map(res => res.data),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  getStudioById(id: number): Observable<booking> {
    this.loadingSubject.next(true);
    return this.http
      .get<{ message: string; data: booking }>(`${environment.apiUrl}get-booking-by-id/${id}`)
      .pipe(
        map(res => res.data),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  create(payload: CreateBookingRequest): Observable<ApiResponse<BookingResponse>> {
    console.log(payload)
    return this.http.post<ApiResponse<BookingResponse>>(
      environment.apiUrl + "bookings", payload);
  }
}
