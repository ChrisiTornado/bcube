export interface User {
  id: number;
  email: string;
  role: 'USER' | 'ADMIN';
  firstName?: string;
  lastName?: string;
  phone?: string;
  isAdmin?: boolean;
}