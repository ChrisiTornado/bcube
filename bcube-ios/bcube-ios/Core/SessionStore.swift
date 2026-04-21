import Combine
import Foundation

@MainActor
final class SessionStore: ObservableObject {
    @Published private(set) var session: UserSession?
    @Published var isRestoringSession = true

    private let authTokenKey = "bcube.auth.token"
    private let authUserKey = "bcube.auth.user"
    private let userService = UserService()

    var isAuthenticated: Bool {
        session != nil
    }

    var currentUser: User? {
        session?.user
    }

    var currentToken: String? {
        session?.token
    }

    func restoreSession() async {
        defer { isRestoringSession = false }

        guard let token = KeychainStore.get(authTokenKey),
              let rawUser = UserDefaults.standard.data(forKey: authUserKey),
              let user = try? JSONDecoder().decode(User.self, from: rawUser) else {
            return
        }

        let resolvedUser: User
        do {
            resolvedUser = try await userService.getUser(id: user.id, token: token)
        } catch {
            resolvedUser = user
        }

        saveSession(token: token, user: resolvedUser)
    }

    func saveSession(token: String, user: User) {
        KeychainStore.set(token, for: authTokenKey)
        if let encoded = try? JSONEncoder().encode(user) {
            UserDefaults.standard.set(encoded, forKey: authUserKey)
        }
        session = UserSession(token: token, user: user)
    }

    func updateUser(_ user: User) {
        guard let token = session?.token else { return }
        saveSession(token: token, user: user)
    }

    func logout() {
        KeychainStore.remove(authTokenKey)
        UserDefaults.standard.removeObject(forKey: authUserKey)
        session = nil
    }
}

extension SessionStore {
    static let preview: SessionStore = {
        let store = SessionStore()
        store.isRestoringSession = false
        return store
    }()

    static let previewAuthenticated: SessionStore = {
        let store = SessionStore()
        store.isRestoringSession = false
        store.saveSession(
            token: "preview-token",
            user: User(
                id: 1,
                email: "preview@bcube.app",
                role: .user,
                firstName: "Preview",
                lastName: "User",
                phone: "+430000000000"
            )
        )
        return store
    }()
}
