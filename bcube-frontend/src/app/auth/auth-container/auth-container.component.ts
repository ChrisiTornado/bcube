import { Component, Input } from '@angular/core';
import {ToastModule} from "primeng/toast";

@Component({
  selector: 'app-auth-container',
  standalone: true,
  imports: [ToastModule],
  templateUrl: './auth-container.component.html',
  styleUrl: './auth-container.component.css'
})
export class AuthContainerComponent {
  @Input() title: string ="";
}
