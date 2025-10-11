import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/User';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiResponse } from '../models/responses/ApiResponse';
import { finalize } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { Booking } from '../models/Booking';
import { CreateBookingRequest } from '../models/requests/CreateBookingRequest';
import { BookingResponse } from '../models/responses/BookingResponse';
import { Studio } from '../models/Studio';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  private bookingSubject = new BehaviorSubject<Booking[]>([]);
  public bookings$ = this.bookingSubject.asObservable();

  constructor(private http: HttpClient) { }

  getAll(): Observable<Booking[]> {
    this.loadingSubject.next(true);
    return this.http
      .get<{ message: string; data: Booking[] }>(`${environment.bookingApiUrl}/bookings`)
      .pipe(
        map(res => res.data),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  getBookingsByUserId(userId: number): Observable<Booking[]> {
    this.loadingSubject.next(true);
    return this.http
      .get<{ message: string; data: Booking[] }>(`${environment.bookingApiUrl}/bookings/user/${userId}`)
      .pipe(
        map(res => res.data),
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
