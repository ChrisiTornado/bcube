export interface UpdateStudioRequest {
    id: number,
    name: string;
    description: string;
    street: string;
    plz: number;
    city: string;
    country: string;
    image: number[];
}