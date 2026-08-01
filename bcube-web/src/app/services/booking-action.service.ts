import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { BookingService } from './booking.service';
import { BookingResponse } from '../models/responses/booking/BookingResponse';
import { ApiResponse } from '../models/responses/ApiResponse';
import { finalize } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';

/** Shared confirm-then-cancel-booking flow, reused by both the admin and user booking views. */
@Injectable({
  providedIn: 'root'
})
export class BookingActionService {
  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private bookingService: BookingService) { }

  confirmStorno(
    booking: BookingResponse,
    onSuccess?: () => void,
    onError?: () => void,
    setLoading?: (loading: boolean) => void
  ): void {
    this.confirmationService.confirm({
      message: `Möchten Sie die Buchung "${booking.id}" für den Kube "${booking.studio.name}" wirklich stornieren?`,
      header: 'Stornieren bestätigen',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Ja',
      rejectLabel: 'Abbrechen',
      accept: () => this.executeStorno(booking, onSuccess, onError, setLoading)
    });
  }

  private executeStorno(
    booking: BookingResponse,
    onSuccess?: () => void,
    onError?: () => void,
    setLoading?: (loading: boolean) => void
  ): void {
    if (setLoading) setLoading(true);

    this.bookingService.storno(booking.id)
      .pipe(finalize(() => setLoading?.(false)))
      .subscribe({
        next: (res: ApiResponse<number>) => {
          this.messageService.add({
            key: 'main',
            severity: 'success',
            summary: 'Erfolg',
            detail: res.message
          });
          this.bookingService.reloadBookings();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          this.messageService.add({
            key: 'main',
            severity: 'error',
            summary: 'Fehler',
            detail: err?.error?.message ?? 'Stornierung fehlgeschlagen.'
          });
          onError?.();
        }
      });
  }
}
