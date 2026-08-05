export interface JwtResponse {
  token: string;
  type: string;
  id: number;
  email: string;
  role: 'USER' | 'ADMIN';
  firstName?: string;
  lastName?: string;
  phone?: string;
  /** Only meaningful for social-login (Google may not return every required field). */
  profileComplete?: boolean;
  authProvider?: 'LOCAL' | 'GOOGLE';
}