/** Mirrors com.bcube.userservice.service.dto.response.UserResponse (user-service). */
export interface UserResponse {
    id: number;
    isAdmin: boolean;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
}