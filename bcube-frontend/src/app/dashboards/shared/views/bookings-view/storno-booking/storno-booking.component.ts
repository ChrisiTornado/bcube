import { Component, Input} from '@angular/core';
import { booking } from '../../../../../models/booking';
import { finalize } from "rxjs";
import { BookingService } from '../../../../../services/booking.service';
import { ButtonModule } from 'primeng/button';
import { MessageService, ConfirmationService } from 'primeng/api';
import { BookingActionService } from '../../../../../services/booking-action.service';

@Component({
  selector: 'app-storno-booking',
  standalone: true,
  imports: [ButtonModule],
  template: `<p-button icon="pi pi-trash" [loading]="loading" (click)="triggerStorno()"></p-button>`,
})
export class StornoBookingComponent {
  @Input() booking!: booking;
   loading!: boolean;
   
   constructor(private bookingActionService: BookingActionService, private bookingService: BookingService, private messageService: MessageService, private confirmationService: ConfirmationService) {}

  //  confirmStorno(): void {
  //   this.confirmationService.confirm({
  //     message: `Möchten Sie die Buchung "${this.booking.id}" für den Kube "${this.booking.studio.name}" wirklich stornieren?`,
  //     header: 'Stornieren bestätigen',
  //     icon: 'pi pi-exclamation-triangle',
  //     acceptLabel: 'Ja',
  //     rejectLabel: 'Nein',
  //     accept: () => this.storno()
  //   });
  // }

  //  storno() {
  //   this.loading = true;
  //   this.bookingService.storno(this.booking.id)
  //     .pipe(finalize(() => this.loading = false))
  //     .subscribe({
  //       next: (res) => {
  //         this.messageService.add({
  //           key: 'main',
  //           severity: 'success',
  //           summary: 'Erfolg',
  //           detail: res.message
  //         });
  
  //         this.bookingService.reloadBookings();
  //       },
  //       error: (err) => {
  //         this.messageService.add({
  //           key: 'main',
  //           severity: 'error',
  //           summary: 'Fehler',
  //           detail: err?.error?.message ?? 'Löschen fehlgeschlagen.'
  //         });
  //       }
  //     });
  //  }

triggerStorno(): void {
  this.bookingActionService.confirmStorno(
    this.booking,
    () => {
      // optional: onSuccess callback
    },
    () => {
      // optional: onError callback
    },
    (isLoading) => this.loading = isLoading
  );
}
}
