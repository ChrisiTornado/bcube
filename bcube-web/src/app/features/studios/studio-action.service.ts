import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ConfirmationService, MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { StudioService } from '@features/studios/studio.service';
import { Studio } from '@models/studio.model';
import { ApiResponse } from '@models/responses/api-response';
import { extractErrorMessage } from '@shared/util/error-message.util';

/** Shared confirm-then-delete-studio flow, reused wherever a studio can be deleted. */
@Injectable({
  providedIn: 'root'
})
export class StudioActionService {
  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private studioService: StudioService
  ) { }

  confirmDelete(studio: Studio, setLoading?: (loading: boolean) => void): void {
    this.confirmationService.confirm({
      message: `Möchten Sie den Cube "${studio.name}" wirklich löschen?`,
      header: 'Löschen bestätigen',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Ja',
      rejectLabel: 'Abbrechen',
      accept: () => this.executeDelete(studio, setLoading)
    });
  }

  private executeDelete(studio: Studio, setLoading?: (loading: boolean) => void): void {
    setLoading?.(true);

    this.studioService.delete(studio.id)
      .pipe(finalize(() => setLoading?.(false)))
      .subscribe({
        next: (res: ApiResponse<number>) => {
          this.messageService.add({
            key: 'main',
            severity: 'success',
            summary: 'Erfolg',
            detail: res.message
          });
          this.studioService.reloadAllStudios();
        },
        error: (err: HttpErrorResponse) => {
          this.messageService.add({
            key: 'main',
            severity: 'error',
            summary: 'Fehler',
            detail: extractErrorMessage(err, 'Löschen fehlgeschlagen.')
          });
        }
      });
  }
}
