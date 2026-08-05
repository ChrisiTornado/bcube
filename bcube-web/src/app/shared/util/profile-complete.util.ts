import { User } from '@models/user.model';

/**
 * Google sign-in never returns a phone number (and occasionally no name), so an account can end
 * up persisted but missing required fields. Used both by the completion dialog itself and by
 * profileCompleteGuard, which blocks the rest of the app until this is true - otherwise someone
 * could abandon the "complete your profile" step and end up with a working session against an
 * account other services (bookings, payments) assume always has a phone number.
 */
export function isProfileComplete(user: Pick<User, 'firstName' | 'lastName' | 'phone'> | null | undefined): boolean {
  return !!user?.firstName && !!user?.lastName && !!user?.phone;
}
