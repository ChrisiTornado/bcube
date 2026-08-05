export interface User {
  id: number;
  email: string;
  role: 'USER' | 'ADMIN';
  firstName?: string;
  lastName?: string;
  phone?: string;
  isAdmin?: boolean;
  /** Google-provided fields (firstName/lastName/email) are locked in the UI once set - see profile-complete.util. */
  authProvider?: 'LOCAL' | 'GOOGLE';
}