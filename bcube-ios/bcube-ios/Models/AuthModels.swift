import Foundation

struct LoginRequest: Encodable {
    let email: String
    let password: String
}

struct RegisterRequest: Encodable {
    let email: String
    let password: String
    let firstName: String
    let lastName: String
    let phone: String
}

struct ResetPasswordRequest: Encodable {
    let email: String
}

struct VerifyCodeRequest: Encodable {
    let email: String
    let code: String
}

struct ChangePasswordRequest: Encodable {
    let email: String
    let password: String
}

struct UpdateUserRequest: Encodable {
    let id: Int
    let email: String
    let firstName: String
    let lastName: String
    let phone: String
    let isAdmin: Bool
}

struct CreateBookingRequest: Encodable {
    let userID: Int
    let studioID: Int
    let date: String
    let startTime: String
    let endTime: String
}

struct JwtResponse: Decodable {
    let id: Int
    let email: String
    let role: UserRole
    let token: String
    let firstName: String?
}

struct GenericMessageResponse: Decodable {
    let message: String
}
