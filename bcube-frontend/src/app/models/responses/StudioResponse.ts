export interface StudioResponse {
  id: number;
  name: string;
  description: string;
  street: string;
  plz: number;
  isActive: boolean;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  image: number[];
}