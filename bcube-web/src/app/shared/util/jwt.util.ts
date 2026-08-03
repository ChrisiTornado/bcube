/** Reads the `exp` claim from a JWT (without verifying its signature - that's the backend's job)
 *  to tell whether it has expired. Treats malformed/unparseable tokens as expired. */
export function isJwtExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized));

    if (typeof decoded.exp !== 'number') {
      return false;
    }

    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
}
