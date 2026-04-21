import Combine
import Foundation

@MainActor
final class LoginViewModel: ObservableObject {
    @Published var email = ""
    @Published var password = ""
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let authService = AuthService()

    func submit(sessionStore: SessionStore) async {
        guard !email.isEmpty, !password.isEmpty else {
            errorMessage = "Bitte E-Mail und Passwort eingeben."
            return
        }

        isLoading = true
        defer { isLoading = false }
        errorMessage = nil

        do {
            let result = try await authService.login(email: email, password: password)
            sessionStore.saveSession(token: result.token, user: result.user)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

@MainActor
final class RegisterViewModel: ObservableObject {
    @Published var email = ""
    @Published var password = ""
    @Published var firstName = ""
    @Published var lastName = ""
    @Published var phone = ""
    @Published var acceptTerms = false
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let authService = AuthService()

    func submit(sessionStore: SessionStore) async {
        guard acceptTerms else {
            errorMessage = "Bitte stimme den AGB zu."
            return
        }

        guard !email.isEmpty, !password.isEmpty, !firstName.isEmpty, !lastName.isEmpty, !phone.isEmpty else {
            errorMessage = "Bitte alle Felder ausfüllen."
            return
        }

        isLoading = true
        defer { isLoading = false }
        errorMessage = nil

        do {
            let result = try await authService.register(
                payload: RegisterRequest(
                    email: email,
                    password: password,
                    firstName: firstName,
                    lastName: lastName,
                    phone: phone
                )
            )
            sessionStore.saveSession(token: result.token, user: result.user)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

@MainActor
final class PasswordResetEmailViewModel: ObservableObject {
    @Published var email = ""
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var infoMessage: String?

    private let authService = AuthService()

    func submit(onSuccess: (String) -> Void) async {
        guard !email.isEmpty else {
            errorMessage = "Bitte gib deine E-Mail-Adresse ein."
            return
        }

        isLoading = true
        defer { isLoading = false }
        errorMessage = nil
        infoMessage = nil

        do {
            infoMessage = try await authService.resetPassword(email: email)
            onSuccess(email)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

@MainActor
final class VerifyCodeViewModel: ObservableObject {
    @Published var digits = Array(repeating: "", count: 6)
    @Published var isLoading = false
    @Published var isResending = false
    @Published var errorMessage: String?
    @Published var infoMessage: String?

    private let authService = AuthService()

    var code: String {
        digits.joined()
    }

    func submit(email: String, onSuccess: () -> Void) async {
        guard code.count == 6 else {
            errorMessage = "Bitte gib den 6-stelligen Code ein."
            return
        }

        isLoading = true
        defer { isLoading = false }
        errorMessage = nil

        do {
            _ = try await authService.verifyCode(email: email, code: code)
            onSuccess()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func resendCode(email: String) async {
        guard !email.isEmpty else {
            errorMessage = "Bitte gib deine E-Mail-Adresse ein."
            return
        }

        isResending = true
        defer { isResending = false }
        errorMessage = nil
        infoMessage = nil

        do {
            infoMessage = try await authService.resetPassword(email: email)
            digits = Array(repeating: "", count: 6)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

@MainActor
final class ChangePasswordViewModel: ObservableObject {
    @Published var password = ""
    @Published var confirmPassword = ""
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var successMessage: String?

    private let authService = AuthService()

    func submit(email: String, onSuccess: @escaping () -> Void) async {
        guard !password.isEmpty, password == confirmPassword else {
            errorMessage = "Die Passwörter stimmen nicht überein."
            return
        }

        isLoading = true
        defer { isLoading = false }
        errorMessage = nil
        successMessage = nil

        do {
            successMessage = try await authService.changePassword(email: email, password: password)
            onSuccess()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
