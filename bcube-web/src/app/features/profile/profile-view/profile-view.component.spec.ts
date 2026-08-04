import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { ProfileViewComponent } from './profile-view.component';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@features/users/user.service';
import { User } from '@models/user.model';

describe('ProfileViewComponent', () => {
  let component: ProfileViewComponent;
  let fixture: ComponentFixture<ProfileViewComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let userService: jasmine.SpyObj<UserService>;
  let router: jasmine.SpyObj<Router>;
  let messageService: MessageService;
  let confirmationService: ConfirmationService;

  const storedUser: User = {
    id: 1, firstName: 'Test', lastName: 'User', email: 'test@example.com', phone: '+43123', role: 'USER'
  };

  function setup(user: User | null = storedUser): void {
    authService = jasmine.createSpyObj('AuthService', [
      'resolveStoredUser', 'isAdmin', 'isAuthenticated', 'persistUserUpdate', 'logout'
    ]);
    authService.resolveStoredUser.and.returnValue(user);
    authService.isAdmin.and.returnValue(false);
    authService.isAuthenticated.and.returnValue(true);
    authService.persistUserUpdate.and.callFake((patch: Partial<User>) => user ? { ...user, ...patch } : null);

    userService = jasmine.createSpyObj('UserService', ['getById', 'updateUser', 'deleteUser']);
    userService.getById.and.returnValue(of(user ?? ({} as User)));

    router = jasmine.createSpyObj('Router', ['navigate'], { url: '/user-dashboard/profile' });

    TestBed.configureTestingModule({
      imports: [ProfileViewComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: UserService, useValue: userService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: {} } }
      ]
    });

    fixture = TestBed.createComponent(ProfileViewComponent);
    component = fixture.componentInstance;
    messageService = fixture.debugElement.injector.get(MessageService);
    confirmationService = fixture.debugElement.injector.get(ConfirmationService);
  }

  it('should create and pre-fill the form from the stored user', () => {
    setup();
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.displayName).toBe('Test User');
    expect(component.initials).toBe('TU');
    expect(component.profileForm.value.email).toBe('test@example.com');
  });

  it('falls back to a generic display name and stops loading when there is no stored user', () => {
    setup(null);
    fixture.detectChanges();

    expect(component.displayName).toBe('Dein Profil');
    expect(component.loading).toBeFalse();
    expect(userService.getById).not.toHaveBeenCalled();
  });

  describe('loadProfile (ngOnInit)', () => {
    it('patches the form and persists the refreshed profile on success', () => {
      setup();
      fixture.detectChanges();

      expect(userService.getById).toHaveBeenCalledWith(1);
      expect(authService.persistUserUpdate).toHaveBeenCalled();
      expect(component.loading).toBeFalse();
    });

    it('shows a warning toast when the refresh fails, without crashing', () => {
      setup();
      userService.getById.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      const addSpy = spyOn(messageService, 'add');

      fixture.detectChanges();

      expect(addSpy).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'warn' }));
      expect(component.loading).toBeFalse();
    });
  });

  describe('saveProfile', () => {
    beforeEach(() => {
      setup();
      fixture.detectChanges();
    });

    it('does nothing but warn when the form is invalid', () => {
      component.profileForm.patchValue({ firstName: '' });
      const addSpy = spyOn(messageService, 'add');

      component.saveProfile();

      expect(userService.updateUser).not.toHaveBeenCalled();
      expect(addSpy).not.toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'success' }));
    });

    it('shows an error and skips the request when the session has expired', () => {
      authService.isAuthenticated.and.returnValue(false);
      const addSpy = spyOn(messageService, 'add');

      component.saveProfile();

      expect(userService.updateUser).not.toHaveBeenCalled();
      expect(addSpy).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'error' }));
    });

    it('updates the profile, persists the patch and shows a success toast', () => {
      userService.updateUser.and.returnValue(of({ message: 'ok', data: storedUser } as any));
      const addSpy = spyOn(messageService, 'add');

      component.saveProfile();

      expect(userService.updateUser).toHaveBeenCalled();
      expect(authService.persistUserUpdate).toHaveBeenCalled();
      expect(addSpy).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'success' }));
      expect(component.saving).toBeFalse();
    });

    it('shows an error toast when the update request fails', () => {
      userService.updateUser.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      const addSpy = spyOn(messageService, 'add');

      component.saveProfile();

      expect(addSpy).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'error' }));
      expect(component.saving).toBeFalse();
    });
  });

  describe('goToPasswordFlow', () => {
    it('navigates to the email-reset flow with the current url as returnUrl', () => {
      setup();
      fixture.detectChanges();

      component.goToPasswordFlow();

      expect(router.navigate).toHaveBeenCalledWith(['/auth/email-reset'], {
        state: { returnUrl: '/user-dashboard/profile' }
      });
    });
  });

  describe('account deletion', () => {
    it('deletes the account, shows a success toast and logs out on confirm', () => {
      setup();
      fixture.detectChanges();
      userService.deleteUser.and.returnValue(of({ message: 'ok', data: 1 } as any));
      const confirmSpy = spyOn(confirmationService, 'confirm').and.callFake((c: any) => c.accept());
      const addSpy = spyOn(messageService, 'add');

      component.openDeleteAccountDialog();

      expect(confirmSpy).toHaveBeenCalled();
      expect(userService.deleteUser).toHaveBeenCalledWith(1);
      expect(addSpy).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'success' }));
      expect(authService.logout).toHaveBeenCalled();
    });

    it('shows an error toast when account deletion fails', () => {
      setup();
      fixture.detectChanges();
      userService.deleteUser.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      spyOn(confirmationService, 'confirm').and.callFake((c: any) => c.accept());
      const addSpy = spyOn(messageService, 'add');

      component.openDeleteAccountDialog();

      expect(addSpy).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'error' }));
      expect(authService.logout).not.toHaveBeenCalled();
    });
  });

  describe('openLogoutDialog', () => {
    it('logs out once the user confirms', () => {
      setup();
      fixture.detectChanges();
      spyOn(confirmationService, 'confirm').and.callFake((c: any) => c.accept());

      component.openLogoutDialog();

      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('openPaymentInfo', () => {
    it('navigates to the payment history view', () => {
      setup();
      fixture.detectChanges();

      component.openPaymentInfo();

      expect(router.navigate).toHaveBeenCalledWith(['/user-dashboard', 'payment-history']);
    });
  });
});
