import { User } from "./user";

export interface studio {
    id: number;
    name: string;
    description: string;
    street: string;
    plz: number;
    isActive: boolean;
    city: string;              
    country: string;           
    latitude?: number | null;
    longitude?: number | null;
    image: number[];
    imageBase64: string;
    users: User[];
}