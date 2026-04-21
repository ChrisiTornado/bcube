import Foundation

struct AuthService {
    private let network = NetworkService.shared
    private let userService = UserService()

    func login(email: String, password: String) async throws -> (token: String, user: User, message: String) {
        let envelope: APIEnvelope<JwtResponse> = try await network.request(
            path: "/api/auth/login",
            method: .post,
            body: LoginRequest(email: email, password: password)
        )

        let fallbackUser = User(
            id: envelope.data.id,
            email: envelope.data.email,
            role: envelope.data.role,
            firstName: envelope.data.firstName,
            lastName: nil,
            phone: nil
        )
        let user = await resolvedUser(from: fallbackUser, token: envelope.data.token)
        return (envelope.data.token, user, envelope.message)
    }

    func register(payload: RegisterRequest) async throws -> (token: String, user: User, message: String) {
        let envelope: APIEnvelope<JwtResponse> = try await network.request(
            path: "/api/auth/register",
            method: .post,
            body: payload
        )

        let fallbackUser = User(
            id: envelope.data.id,
            email: envelope.data.email,
            role: envelope.data.role,
            firstName: payload.firstName,
            lastName: payload.lastName,
            phone: payload.phone
        )
        let user = await resolvedUser(from: fallbackUser, token: envelope.data.token)
        return (envelope.data.token, user, envelope.message)
    }

    func resetPassword(email: String) async throws -> String {
        let envelope: APIEnvelope<GenericMessagePayload> = try await network.request(
            path: "/api/auth/reset-password",
            method: .post,
            body: ResetPasswordRequest(email: email)
        )
        return envelope.message
    }

    func verifyCode(email: String, code: String) async throws -> String {
        let envelope: APIEnvelope<GenericMessagePayload> = try await network.request(
            path: "/api/auth/verify-code",
            method: .post,
            body: VerifyCodeRequest(email: email, code: code)
        )
        return envelope.message
    }

    func changePassword(email: String, password: String) async throws -> String {
        let envelope: APIEnvelope<GenericMessagePayload> = try await network.request(
            path: "/api/auth/change-password",
            method: .post,
            body: ChangePasswordRequest(email: email, password: password)
        )
        return envelope.message
    }

    private func resolvedUser(from fallbackUser: User, token: String) async -> User {
        do {
            return try await userService.getUser(id: fallbackUser.id, token: token)
        } catch {
            return fallbackUser
        }
    }
}

private struct GenericMessagePayload: Decodable {}
