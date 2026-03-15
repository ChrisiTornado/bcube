import { Component, Input } from '@angular/core';
import { finalize } from "rxjs";
import { StudioService } from '../../../../../services/studio.service';
import { Studio } from '../../../../../models/Studio';
import { ButtonModule } from 'primeng/button';
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-delete-studio',
  standalone: true,
  imports: [ButtonModule],
  template: `
  <p-button icon="pi pi-trash" styleClass="p-button-danger" [loading]="loading" (click)="confirmDelete()"></p-button>
`
})
export class DeleteStudioComponent {
  @Input() studio!: Studio;
  loading!: boolean;

  constructor(private studioService: StudioService, private messageService: MessageService, private confirmationService: ConfirmationService) { }

  confirmDelete(): void {
    this.confirmationService.confirm({
      message: `Möchten Sie den Cube "${this.studio.name}" wirklich löschen?`,
      header: 'Löschen bestätigen',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Ja',
      rejectLabel: 'Abbrechen',
      accept: () => this.delete()
    });
  }

  delete() {
    this.loading = true;
    this.studioService.delete(this.studio.id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res) => {
          this.messageService.add({
            key: 'main',
            severity: 'success',
            summary: 'Erfolg',
            detail: res.message
          });
          this.studioService.reloadStudios();
        },
        error: (err) => {
          this.messageService.add({
            key: 'main',
            severity: 'error',
            summary: 'Fehler',
            detail: err?.error?.message ?? 'Löschen fehlgeschlagen.'
          });
        }
      });
  }
}
