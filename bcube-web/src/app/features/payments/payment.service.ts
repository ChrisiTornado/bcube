import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse } from '@models/responses/api-response';
import { PageResponse } from '@models/responses/page-response';
import { PaymentResponse } from '@models/responses/payment/payment-response';
import { VoucherPreviewResponse } from '@models/responses/payment/voucher-preview-response';
import { VoucherResponse } from '@models/responses/payment/voucher-response';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  constructor(private http: HttpClient) {}

  getHistory(userId: number, page: number, size: number): Observable<PageResponse<PaymentResponse>> {
    return this.http
      .get<ApiResponse<PageResponse<PaymentResponse>>>(`${environment.paymentApiUrl}/user/${userId}`, { params: { page, size } })
      .pipe(map(res => res.data));
  }

  getByBooking(bookingId: number): Observable<PaymentResponse> {
    return this.http
      .get<ApiResponse<PaymentResponse>>(`${environment.paymentApiUrl}/booking/${bookingId}`)
      .pipe(map(res => res.data));
  }

  validateVoucher(code: string, userId: number, hourlyRateCents: number, durationHours: number): Observable<VoucherPreviewResponse> {
    return this.http
      .post<ApiResponse<VoucherPreviewResponse>>(`${environment.paymentApiUrl}/vouchers/validate`, {
        code, userId, hourlyRateCents, durationHours
      })
      .pipe(map(res => res.data));
  }

  getMyAvailableVouchers(userId: number): Observable<VoucherResponse[]> {
    return this.http
      .get<ApiResponse<VoucherResponse[]>>(`${environment.paymentApiUrl}/vouchers/my-available`, { params: { userId } })
      .pipe(map(res => res.data));
  }

  confirmCardVerification(bookingId: number): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${environment.paymentApiUrl}/${bookingId}/confirm-card-verification`, {})
      .pipe(map(() => undefined));
  }

  downloadInvoice(paymentId: number): Observable<Blob> {
    return this.http.get(`${environment.paymentApiUrl}/${paymentId}/invoice`, { responseType: 'blob' });
  }
}
