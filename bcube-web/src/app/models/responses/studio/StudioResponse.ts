export interface StudioResponse {
  id: number;
  smartlockId: number;
  name: string;
  description: string;
  street: string;
  plz: number;
  isActive: boolean;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  imageBase64: string;
  imageGalleryBase64: string[];
}
