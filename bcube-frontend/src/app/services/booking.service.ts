import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/User';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiResponse } from '../models/responses/ApiResponse';
import { finalize } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { Booking } from '../models/Booking';
import { CreateBookingRequest } from '../models/requests/booking/CreateBookingRequest';
import { BookingResponse } from '../models/responses/booking/BookingResponse';
import { Studio } from '../models/Studio';
import { PageResponse } from '../models/responses/PageResponse';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  private bookingSubject = new BehaviorSubject<Booking[]>([]);
  public bookings$ = this.bookingSubject.asObservable();

  constructor(private http: HttpClient) { }

  getAll(page: number = 0, size: number = 10): Observable<PageResponse<Booking>> {
    this.loadingSubject.next(true);

    return this.http
      .get<ApiResponse<PageResponse<Booking>>>(`${environment.bookingApiUrl}/bookings?page=${page}&size=${size}`)
      .pipe(
        map(res => res.data),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  getBookingsByUserId(
  userId: number,
  page: number = 0,
  size: number = 10
): Observable<PageResponse<Booking>> {
  this.loadingSubject.next(true);

  return this.http
    .get<ApiResponse<PageResponse<Booking>>>(
      `${environment.bookingApiUrl}/bookings/user/${userId}?page=${page}&size=${size}`
    )
    .pipe(
      map(res => res.data), // data = PageResponse<Booking>
      finalize(() => this.loadingSubject.next(false))
    );
}

  getBookingsByStudioId(studioId: number): Observable<Booking[]> {
    this.loadingSubject.next(true);
    return this.http
      .get<{ message: string; data: Booking[] }>(`${environment.bookingApiUrl}/bookings/studio/${studioId}`)
      .pipe(
        map(res => res.data),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  getBookingById(bookingId: number): Observable<Booking> {
    this.loadingSubject.next(true);
    return this.http
      .get<{ message: string; data:Booking }>(`${environment.bookingApiUrl}/bookings/${bookingId}`)
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

  reloadBookings(page: number = 0, size: number = 10): void {
    this.getAll(page, size).subscribe(pageResponse => {
      this.bookingSubject.next(pageResponse.content);
    });
  }

  create(payload: CreateBookingRequest): Observable<ApiResponse<BookingResponse>> {
    console.log(payload)
    return this.http.post<ApiResponse<BookingResponse>>(
      environment.bookingApiUrl + "/bookings", payload);
  }

  storno(id: number): Observable<ApiResponse<number>>{
    return this.http.delete<ApiResponse<number>>(
      environment.bookingApiUrl + "/bookings/" + id
    )
  }

  public filteredBookings$(user: User | null, studio: Studio | null): Observable<Booking[]> {
  return this.bookingSubject.asObservable().pipe(
    map(bookings =>
      bookings.filter(booking => {
        const matchesUser = !user || booking.user.id === user.id;
        const matchesStudio = !studio || booking.studio.id === studio.id;
        return matchesUser && matchesStudio;
      })
    )
  );
}
}
