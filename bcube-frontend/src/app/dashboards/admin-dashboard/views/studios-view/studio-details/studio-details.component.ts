import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { finalize } from "rxjs";
import { AuthService } from '../../../../../services/auth/auth.service';
import { StudioService } from '../../../../../services/studio.service';
import { LoadingSpinnerComponent } from '../../../../../shared/loading-spinner/loading-spinner.component';
import { studio } from '../../../../../models/studio';
import { BookingService } from '../../../../../services/booking.service';
import { CreateBookingRequest } from '../../../../../models/requests/CreateBookingRequest';
import { ApiResponse } from '../../../../../models/responses/ApiResponse';
import { BookingResponse } from '../../../../../models/responses/BookingResponse';
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-studio-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CalendarModule,
    DropdownModule,
    ButtonModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './studio-details.component.html',
  styleUrl: './studio-details.component.css'
})
export class StudioDetailsComponent implements OnInit {

  /* ------------------------- State ------------------------- */
  studio: studio | null = null;
  isUser = false;
  date: Date | null = null;
  loading!: boolean;

  /* Dropdown-Daten */
  startHours: { label: string; value: string; disabled?: boolean }[] = [];
  startMinutes: { label: string; value: string; disabled?: boolean }[] = [];

  /* Gewählte Werte */
  selectedStartHour = '';
  selectedStartMinute = '';

  selectedEndHour = '';
  selectedEndMinute = '';


  /* Loading-Stream aus Service */
  loading$ = this.studioService.loading$;

  constructor(
    private route: ActivatedRoute,
    private studioService: StudioService,
    private authService: AuthService,
    private bookingService: BookingService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  /* ------------------------- Lifecycle ------------------------- */
  ngOnInit(): void {
    this.isUser = this.authService.getRole() === 'USER';
    this.generateTimeParts();

    const studioId = this.route.snapshot.paramMap.get('id');
    if (studioId) {
      this.studioService.getStudioById(+studioId).subscribe(data => (this.studio = data));
    }
  }

  /* ------------------------- Time-Helpers ------------------------- */
  generateTimeParts(): void {
    this.startHours = [];
    this.startMinutes = [];
  
    for (let h = 0; h < 24; h++) {
      const label = h.toString().padStart(2, '0');
      this.startHours.push({ label, value: label });
    }
  
    for (let m of [0, 15, 30, 45]) {
      const label = m.toString().padStart(2, '0');
      this.startMinutes.push({ label, value: label });
    }
  }

  confirmBooking(): void {
    this.confirmationService.confirm({
      message: `Möchten Sie das Studio "${this.studio!.name}" wirklich buchen?`,
      header: 'Buchung bestätigen',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Ja',
      rejectLabel: 'Nein',
      accept: () => this.book()
    });
  }

  book() {
    this.loading = true;
    let formattedDate: string | null = null;

    console.log(this.date)
    if (this.date) {
      formattedDate = this.formatDate(this.date);
    }

    const payload: CreateBookingRequest = {
        userID: this.authService.getUser()!.id,
        studioID: this.studio!.id,
        date: formattedDate!,
        startTime: `${this.selectedStartHour}:${this.selectedStartMinute}`,
        endTime: `${this.selectedEndHour}:${this.selectedEndMinute}`
    }

    this.bookingService.create(payload)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res: ApiResponse<BookingResponse>) => {
            const bookingResult = res.data;
            console.log(bookingResult)
        }
      })
  }

  formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
  
    return `${day}.${month}.${year}`;
  }

  canBook(): boolean {
    return (
      this.date !== null &&
      this.selectedStartHour !== '' &&
      this.selectedStartMinute !== '' &&
      this.selectedEndHour !== '' &&
      this.selectedEndMinute !== ''
    );
  }
  
}
