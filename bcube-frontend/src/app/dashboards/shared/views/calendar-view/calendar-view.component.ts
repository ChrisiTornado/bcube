import { Component } from '@angular/core';
import { CalendarModule } from 'primeng/calendar';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CalendarModule, FormsModule],
  templateUrl: './calendar-view.component.html',
  styleUrl: './calendar-view.component.css'
})
export class CalendarViewComponent {
  date = null;
}
