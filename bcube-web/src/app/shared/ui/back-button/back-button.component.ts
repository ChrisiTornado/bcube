import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

/**
 * The one "go back" control. Look and feel come from the PrimeNG preset
 * (outlined variant), so every screen renders it identically.
 */
@Component({
  selector: 'app-back-button',
  imports: [ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-button
      type="button"
      [outlined]="true"
      icon="pi pi-arrow-left"
      [label]="label()"
      (onClick)="back.emit()" />
  `,
  styles: `:host { display: inline-flex; flex-shrink: 0; }`
})
export class BackButtonComponent {
  readonly label = input('Zurück');
  readonly back = output<void>();
}
