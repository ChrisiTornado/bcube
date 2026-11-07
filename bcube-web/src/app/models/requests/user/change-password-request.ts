export interface ChangePasswordRequest {
    email: string;
    resetToken: string;
    password: string;
}