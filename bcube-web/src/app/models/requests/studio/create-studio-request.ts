export interface CreateStudioRequest {
    smartlockId: number;
    name: string;
    description: string;
    street: string;
    plz: number;
    city: string;
    country: string;
    image: number[];
    images: number[][];
    hourlyRateCents: number;
}
