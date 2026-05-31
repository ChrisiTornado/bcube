import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment.local';
import { ApiResponse } from '../models/responses/ApiResponse';

export interface CheckInResponse {
  bookingId: number;
  smartlockId: number;
  validFrom: string;
  validUntil: string;
}

export interface FaceVerificationResponse {
  verified: boolean;
}

export interface AccessCodeResponse {
  accessCode: number;
}

@Injectable({ providedIn: 'root' })
export class AccessService {
  constructor(private http: HttpClient) {}

  checkIn(authCode: string): Observable<CheckInResponse> {
    return this.http
      .post<ApiResponse<CheckInResponse>>(`${environment.accessApiUrl}/check-in`, { authCode })
      .pipe(map(res => res.data));
  }

  verifyFace(image: Blob, bookingId: number): Observable<FaceVerificationResponse> {
    const formData = new FormData();
    formData.append('image', image, 'face.jpg');
    formData.append('bookingId', bookingId.toString());
    return this.http
      .post<ApiResponse<FaceVerificationResponse>>(`${environment.accessApiUrl}/verify-face`, formData)
      .pipe(map(res => res.data));
  }

  generateNukiCode(bookingId: number): Observable<AccessCodeResponse> {
    return this.http
      .post<ApiResponse<AccessCodeResponse>>(`${environment.accessApiUrl}/generate-nuki-code/${bookingId}`, {})
      .pipe(map(res => res.data));
  }
}
