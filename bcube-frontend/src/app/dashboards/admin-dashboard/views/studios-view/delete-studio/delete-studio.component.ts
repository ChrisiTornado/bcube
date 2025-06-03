import { Component, Input} from '@angular/core';
import { finalize } from "rxjs";
import { StudioService } from '../../../../../services/studio.service';
import { studio } from '../../../../../models/studio';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-delete-studio',
  standalone: true,
  imports: [ButtonModule],
  template: `
  <p-button icon="pi pi-trash" styleClass="p-button-danger" [loading]="loading" (click)="delete()"></p-button>
`
})
export class DeleteStudioComponent {
   @Input() studio!: studio;
   loading!: boolean;
   
   constructor(private studioService: StudioService, private messageService: MessageService) {}

  delete() {
  this.loading = true;
  this.studioService.delete(this.studio.id)
    .pipe(finalize(() => this.loading = false))
    .subscribe({
      next: (res) => {
        // Erfolgsmeldung anzeigen
        this.messageService.add({
          key: 'main',
          severity: 'success',
          summary: 'Erfolg',
          detail: res.message
        });

        // Studios neu laden
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
