/**
 * Absolute path into the area matching the role: admins live under /admin-dashboard, while the
 * user area (public for guests) sits at the app root - e.g. getDashboardPath(false, 'studios')
 * is '/studios'. Centralized since this branch was previously duplicated across most components.
 */
export function getDashboardPath(isAdmin: boolean, ...segments: (string | number)[]): string {
  return `${isAdmin ? '/admin-dashboard' : ''}/${segments.join('/')}`;
}
