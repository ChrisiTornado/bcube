export interface UpdateStudioRequest {
    id: number,
    smartlockId: number;
    name: string;
    description: string;
    street: string;
    plz: number;
    city: string;
    country: string;
    image: number[];
    images: number[][];
}
