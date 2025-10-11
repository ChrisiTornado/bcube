import { Injectable } from '@angular/core';
import { BookingService } from './booking.service';
import { BookingResponse } from '../models/responses/BookingResponse';
import { finalize } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';

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
        next: (res) => {
          this.messageService.add({
            key: 'main',
            severity: 'success',
            summary: 'Erfolg',
            detail: res.message
          });
          this.bookingService.reloadBookings();
          onSuccess?.();
        },
        error: (err) => {
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
