import { Component } from '@angular/core';
import {ProgressSpinnerModule} from "primeng/progressspinner";

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [ProgressSpinnerModule],
  template: `
    <div class="flex justify-content-center">
      <p-progressSpinner aria-label="Loading"></p-progressSpinner>
    </div>
  `
})
export class LoadingSpinnerComponent {

}
