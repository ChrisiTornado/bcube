import Foundation

struct UserService {
    private let network = NetworkService.shared

    func getUser(id: Int, token: String) async throws -> User {
        let envelope: APIEnvelope<User> = try await network.request(path: "/api/users/\(id)", requiresAuth: true, token: token)
        return envelope.data
    }

    func updateUser(payload: UpdateUserRequest, token: String) async throws -> (User, String) {
        let envelope: APIEnvelope<User> = try await network.request(
            path: "/api/users/me",
            method: .put,
            body: payload,
            requiresAuth: true,
            token: token
        )
        return (envelope.data, envelope.message)
    }
}
