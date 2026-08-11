import { Component, ChangeDetectionStrategy } from '@angular/core';
import {ProgressSpinnerModule} from "primeng/progressspinner";

@Component({
    selector: 'app-loading-spinner',
    imports: [ProgressSpinnerModule],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
    <div class="flex justify-content-center">
      <p-progressSpinner aria-label="Loading"></p-progressSpinner>
    </div>
  `
})
export class LoadingSpinnerComponent {

}
