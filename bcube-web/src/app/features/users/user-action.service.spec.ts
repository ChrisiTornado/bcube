import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ConfirmationService, MessageService, Confirmation } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { UserActionService } from './user-action.service';
import { UserService } from '@features/users/user.service';
import { User } from '@models/user.model';

describe('UserActionService', () => {
  let service: UserActionService;
  let confirmationService: jasmine.SpyObj<ConfirmationService>;
  let messageService: jasmine.SpyObj<MessageService>;
  let userService: jasmine.SpyObj<UserService>;

  const user = { id: 1, firstName: 'Test', lastName: 'User' } as User;

  beforeEach(() => {
    confirmationService = jasmine.createSpyObj('ConfirmationService', ['confirm']);
    messageService = jasmine.createSpyObj('MessageService', ['add']);
    userService = jasmine.createSpyObj('UserService', ['deleteUser', 'reloadUsers']);

    TestBed.configureTestingModule({
      providers: [
        UserActionService,
        { provide: ConfirmationService, useValue: confirmationService },
        { provide: MessageService, useValue: messageService },
        { provide: UserService, useValue: userService }
      ]
    });

    service = TestBed.inject(UserActionService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('confirmDelete', () => {
    it('asks for confirmation with the user name in the message', () => {
      service.confirmDelete(user);

      expect(confirmationService.confirm).toHaveBeenCalled();
      const config = confirmationService.confirm.calls.mostRecent().args[0] as Confirmation;
      expect(config.message).toContain('Test User');
    });

    it('does not call deleteUser before the user confirms', () => {
      service.confirmDelete(user);
      expect(userService.deleteUser).not.toHaveBeenCalled();
    });

    it('deletes the user, shows a success toast and reloads the list once confirmed', () => {
      userService.deleteUser.and.returnValue(of({ message: 'User gelöscht.', data: 1 }));
      const setLoading = jasmine.createSpy('setLoading');

      service.confirmDelete(user, setLoading);
      const config = confirmationService.confirm.calls.mostRecent().args[0] as Confirmation;
      config.accept!();

      expect(userService.deleteUser).toHaveBeenCalledWith(1);
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'success' }));
      expect(userService.reloadUsers).toHaveBeenCalled();
      expect(setLoading).toHaveBeenCalledWith(true);
      expect(setLoading).toHaveBeenCalledWith(false);
    });

    it('shows an error toast and does not reload when the delete request fails', () => {
      userService.deleteUser.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

      service.confirmDelete(user);
      const config = confirmationService.confirm.calls.mostRecent().args[0] as Confirmation;
      config.accept!();

      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'error' }));
      expect(userService.reloadUsers).not.toHaveBeenCalled();
    });
  });
});
