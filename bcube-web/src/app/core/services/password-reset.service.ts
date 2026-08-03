import { Injectable } from '@angular/core';

/**
 * Encapsulates the state that needs to travel across the multi-step (email → code →
 * password) reset flow, since each step is its own routed page. In-memory rather than
 * localStorage: the flow only makes sense within one browser session anyway, and this
 * avoids leaking a stale email/return-url into localStorage if the flow is abandoned.
 */
@Injectable({ providedIn: 'root' })
export class PasswordResetService {
  private returnUrl: string | null = null;
  private email: string | null = null;
  private successMessage: string | null = null;

  setReturnUrl(url: string | undefined): void {
    this.returnUrl = url || '/login';
  }

  getReturnUrl(): string {
    return this.returnUrl || '/login';
  }

  clearReturnUrl(): void {
    this.returnUrl = null;
  }

  setEmail(email: string): void {
    this.email = email;
  }

  getEmail(): string | null {
    return this.email;
  }

  clearEmail(): void {
    this.email = null;
  }

  setSuccessMessage(message: string): void {
    this.successMessage = message;
  }

  /** Reads and clears the pending success message - meant to be shown exactly once. */
  consumeSuccessMessage(): string | null {
    const message = this.successMessage;
    this.successMessage = null;
    return message;
  }
}
