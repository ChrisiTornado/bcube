import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extracts the backend's error message from an HttpErrorResponse (found at err.error.message,
 * the parsed response body), falling back to a caller-provided default when it's missing.
 * err.message itself is just the generic HTTP-layer text (e.g. "Http failure response for ...")
 * and is never useful to show to a user.
 */
export function extractErrorMessage(err: HttpErrorResponse, fallback: string): string {
  return err?.error?.message ?? fallback;
}
