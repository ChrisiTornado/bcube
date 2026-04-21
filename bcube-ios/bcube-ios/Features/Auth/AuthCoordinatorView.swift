import SwiftUI

enum AuthFlowMode {
    case authentication
    case passwordReset(onComplete: (() -> Void)? = nil)
}

enum AuthRoute: Hashable {
    case register
    case emailReset
    case verify(email: String)
    case changePassword(email: String)
}

struct AuthCoordinatorView: View {
    let mode: AuthFlowMode
    var embeddedInNavigation = false
    @State private var path: [AuthRoute] = []

    var body: some View {
        NavigationStack(path: $path) {
            coordinatorContent
        }
    }

    private var coordinatorContent: some View {
        rootView
            .navigationDestination(for: AuthRoute.self) { route in
                switch route {
                case .register:
                    RegisterView(onLogin: { path = [] })
                case .emailReset:
                    EmailResetView { email in
                        path.append(.verify(email: email))
                    }
                case .verify(let email):
                    VerifyResetCodeView(email: email) {
                        path.append(.changePassword(email: email))
                    }
                case .changePassword(let email):
                    ChangePasswordView(email: email) {
                        switch mode {
                        case .authentication:
                            path = []
                        case .passwordReset(let onComplete):
                            onComplete?()
                        }
                    }
                }
            }
    }

    @ViewBuilder
    private var rootView: some View {
        switch mode {
        case .authentication:
            LoginView(
                showRegister: true,
                onRegister: { path.append(.register) },
                onForgotPassword: { path.append(.emailReset) }
            )
        case .passwordReset:
            EmailResetView { email in
                path.append(.verify(email: email))
            }
        }
    }

}
