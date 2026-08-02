import { Component, Input } from '@angular/core';

import { RouterModule } from '@angular/router';
import {ToastModule} from "primeng/toast";

@Component({
    selector: 'app-auth-container',
    imports: [ToastModule, RouterModule],
    templateUrl: './auth-container.component.html',
    styleUrl: './auth-container.component.css'
})
export class AuthContainerComponent {
  @Input() title: string ="";
}
