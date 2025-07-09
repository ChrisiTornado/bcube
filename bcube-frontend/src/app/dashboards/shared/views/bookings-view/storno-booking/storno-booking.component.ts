import { Component, Input} from '@angular/core';
import { booking } from '../../../../../models/booking';
import { finalize } from "rxjs";
import { BookingService } from '../../../../../services/booking.service';
import { ButtonModule } from 'primeng/button';
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-storno-booking',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './storno-booking.component.html',
  styleUrl: './storno-booking.component.css'
})
export class StornoBookingComponent {
  @Input() booking!: booking;
   loading!: boolean;

   confirmStorno() {

   }
}
