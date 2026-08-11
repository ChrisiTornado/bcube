import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { RouterModule } from '@angular/router';
import {ToastModule} from "primeng/toast";

@Component({
    selector: 'app-auth-container',
    imports: [ToastModule, RouterModule],
    templateUrl: './auth-container.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './auth-container.component.css'
})
export class AuthContainerComponent {
  @Input() title: string ="";
}
