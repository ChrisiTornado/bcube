/** The two dashboards' route roots differ only by role - centralized here since this
 *  ternary was previously duplicated across most feature components. */
export function getDashboardBasePath(isAdmin: boolean): string {
  return isAdmin ? '/admin-dashboard' : '/user-dashboard';
}
