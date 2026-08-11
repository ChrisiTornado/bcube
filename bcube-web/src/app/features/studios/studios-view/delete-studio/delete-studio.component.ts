import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Studio } from '@models/studio.model';
import { StudioActionService } from '@features/studios/studio-action.service';

@Component({
    selector: 'app-delete-studio',
    imports: [ButtonModule],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
  <p-button icon="pi pi-trash" styleClass="p-button-danger" [loading]="loading" ariaLabel="Cube löschen" (click)="confirmDelete()"></p-button>
`
})
export class DeleteStudioComponent {
  @Input() studio!: Studio;
  loading = false;

  constructor(private studioActionService: StudioActionService) { }

  confirmDelete(): void {
    this.studioActionService.confirmDelete(this.studio, loading => this.loading = loading);
  }
}
