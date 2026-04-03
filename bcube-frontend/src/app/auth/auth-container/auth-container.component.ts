import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {ToastModule} from "primeng/toast";

@Component({
  selector: 'app-auth-container',
  standalone: true,
  imports: [ToastModule, RouterModule, CommonModule],
  templateUrl: './auth-container.component.html',
  styleUrl: './auth-container.component.css'
})
export class AuthContainerComponent {
  @Input() title: string ="";
}
