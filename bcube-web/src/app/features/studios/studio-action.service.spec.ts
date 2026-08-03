import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ConfirmationService, MessageService, Confirmation } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { StudioActionService } from './studio-action.service';
import { StudioService } from '@features/studios/studio.service';
import { Studio } from '@models/studio.model';

describe('StudioActionService', () => {
  let service: StudioActionService;
  let confirmationService: jasmine.SpyObj<ConfirmationService>;
  let messageService: jasmine.SpyObj<MessageService>;
  let studioService: jasmine.SpyObj<StudioService>;

  const studio = { id: 1, name: 'Test Cube' } as Studio;

  beforeEach(() => {
    confirmationService = jasmine.createSpyObj('ConfirmationService', ['confirm']);
    messageService = jasmine.createSpyObj('MessageService', ['add']);
    studioService = jasmine.createSpyObj('StudioService', ['delete', 'reloadAllStudios']);

    TestBed.configureTestingModule({
      providers: [
        StudioActionService,
        { provide: ConfirmationService, useValue: confirmationService },
        { provide: MessageService, useValue: messageService },
        { provide: StudioService, useValue: studioService }
      ]
    });

    service = TestBed.inject(StudioActionService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('confirmDelete', () => {
    it('asks for confirmation with the studio name in the message', () => {
      service.confirmDelete(studio);

      expect(confirmationService.confirm).toHaveBeenCalled();
      const config = confirmationService.confirm.calls.mostRecent().args[0] as Confirmation;
      expect(config.message).toContain('Test Cube');
    });

    it('does not call delete before the user confirms', () => {
      service.confirmDelete(studio);
      expect(studioService.delete).not.toHaveBeenCalled();
    });

    it('deletes the studio, shows a success toast and reloads the list once confirmed', () => {
      studioService.delete.and.returnValue(of({ message: 'Cube gelöscht.', data: 1 }));
      const setLoading = jasmine.createSpy('setLoading');

      service.confirmDelete(studio, setLoading);
      const config = confirmationService.confirm.calls.mostRecent().args[0] as Confirmation;
      config.accept!();

      expect(studioService.delete).toHaveBeenCalledWith(1);
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'success' }));
      expect(studioService.reloadAllStudios).toHaveBeenCalled();
      expect(setLoading).toHaveBeenCalledWith(true);
      expect(setLoading).toHaveBeenCalledWith(false);
    });

    it('shows an error toast and does not reload when the delete request fails', () => {
      studioService.delete.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

      service.confirmDelete(studio);
      const config = confirmationService.confirm.calls.mostRecent().args[0] as Confirmation;
      config.accept!();

      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'error' }));
      expect(studioService.reloadAllStudios).not.toHaveBeenCalled();
    });
  });
});
