export interface JwtResponse {
  token: string;
  type: string;
  id: number;
  email: string;
  role: 'USER' | 'ADMIN';
}