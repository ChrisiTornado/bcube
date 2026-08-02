export interface UpdateUserRequest {
    id: number;
    email: string;
    isAdmin: boolean;
    firstName: string;
    lastName: string;
    phone: string;
}