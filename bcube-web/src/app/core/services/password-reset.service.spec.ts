import { TestBed } from '@angular/core/testing';
import { PasswordResetService } from './password-reset.service';

describe('PasswordResetService', () => {
  let service: PasswordResetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PasswordResetService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('returnUrl', () => {
    it('defaults to /login when nothing was ever set', () => {
      expect(service.getReturnUrl()).toBe('/login');
    });

    it('falls back to /login when setReturnUrl is called with undefined', () => {
      service.setReturnUrl(undefined);
      expect(service.getReturnUrl()).toBe('/login');
    });

    it('stores and returns the given return url', () => {
      service.setReturnUrl('/user-dashboard/studios');
      expect(service.getReturnUrl()).toBe('/user-dashboard/studios');
    });

    it('clearReturnUrl resets back to the /login default', () => {
      service.setReturnUrl('/user-dashboard/studios');
      service.clearReturnUrl();
      expect(service.getReturnUrl()).toBe('/login');
    });
  });

  describe('email', () => {
    it('returns null when nothing was ever set', () => {
      expect(service.getEmail()).toBeNull();
    });

    it('stores and returns the given email', () => {
      service.setEmail('test@example.com');
      expect(service.getEmail()).toBe('test@example.com');
    });

    it('clearEmail resets back to null', () => {
      service.setEmail('test@example.com');
      service.clearEmail();
      expect(service.getEmail()).toBeNull();
    });
  });

  describe('successMessage', () => {
    it('returns null when nothing was ever set', () => {
      expect(service.consumeSuccessMessage()).toBeNull();
    });

    it('returns the message once and then clears it', () => {
      service.setSuccessMessage('Passwort erfolgreich geändert.');

      expect(service.consumeSuccessMessage()).toBe('Passwort erfolgreich geändert.');
      expect(service.consumeSuccessMessage()).toBeNull();
    });
  });
});
