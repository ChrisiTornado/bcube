import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';

import { AuthService } from '../../../../../services/auth/auth.service';
import { StudioService } from '../../../../../services/studio.service';
import { LoadingSpinnerComponent } from '../../../../../shared/loading-spinner/loading-spinner.component';
import { studio } from '../../../../../models/studio';

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
    private authService: AuthService
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

  book() {
    let formattedDate: string | null = null;

    console.log(this.date)
    if (this.date) {
      formattedDate = this.formatDate(this.date);
    }

    console.log(formattedDate)
    console.log(this.selectedStartHour + ":" + this.selectedStartMinute)
    console.log(this.selectedEndHour + ":" + this.selectedEndMinute)
  }

  formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() ist 0-basiert
    const year = date.getFullYear();
  
    return `${day}.${month}.${year}`; // z. B. 17.07.2025
  }
}
