const RETURN_URL_KEY = 'authReturnUrl';

// First path segments of the user area (see the root shell in app.routes.ts).
const USER_AREA_PATH = /^\/(studios|studio-details|my-cube|calendar|bookings|booking-details|profile|payment-history)(?:[/?#]|$)/;

/**
 * Only in-app user-area paths are accepted - anything else (absolute URLs, protocol-relative
 * "//evil.com", admin or auth pages) is dropped so a crafted ?returnUrl= can't turn login into
 * an open redirect or a loop back to /login.
 */
function isSafeReturnUrl(url: string | null | undefined): url is string {
  return !!url && USER_AREA_PATH.test(url);
}

/**
 * Kept in sessionStorage rather than only in the query string because the Google sign-in leaves
 * the app entirely (full-page OAuth redirect) and comes back via /auth/oauth-callback.
 * Passing null clears a stale value from an earlier, abandoned login attempt.
 */
export function rememberReturnUrl(url: string | null): void {
  if (isSafeReturnUrl(url)) {
    sessionStorage.setItem(RETURN_URL_KEY, url);
  } else {
    sessionStorage.removeItem(RETURN_URL_KEY);
  }
}

/** Returns the remembered page once and forgets it, so it never leaks into a later login. */
export function consumeReturnUrl(): string | null {
  const url = sessionStorage.getItem(RETURN_URL_KEY);
  sessionStorage.removeItem(RETURN_URL_KEY);
  return isSafeReturnUrl(url) ? url : null;
}
