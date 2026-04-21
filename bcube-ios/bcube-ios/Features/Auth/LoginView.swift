import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    @StateObject private var viewModel = LoginViewModel()

    let showRegister: Bool
    let onRegister: () -> Void
    let onForgotPassword: () -> Void

    var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(spacing: 24) {
                Spacer(minLength: 20)
                BrandBadgeView()

                BcubeCard {
                    VStack(alignment: .leading, spacing: 18) {
                        Text("Anmelden")
                            .font(.system(size: 28, weight: .black, design: .rounded))
                            .foregroundStyle(BcubeTheme.Colors.textPrimary)

                        Group {
                            TextField("E-Mail-Adresse", text: $viewModel.email)
                                .textInputAutocapitalization(.never)
                                .keyboardType(.emailAddress)
                                .bcubeTextField()

                            SecureField("Passwort", text: $viewModel.password)
                                .bcubeTextField()
                        }

                        if let errorMessage = viewModel.errorMessage {
                            Text(errorMessage)
                                .font(.footnote.weight(.semibold))
                                .foregroundStyle(BcubeTheme.Colors.accent)
                        }

                        Button("Passwort vergessen?", action: onForgotPassword)
                            .foregroundStyle(BcubeTheme.Colors.accent)
                            .font(.footnote.weight(.bold))

                        Button {
                            Task {
                                await viewModel.submit(sessionStore: sessionStore)
                            }
                        } label: {
                            if viewModel.isLoading {
                                ProgressView()
                                    .tint(.black)
                            } else {
                                Text("Einloggen")
                            }
                        }
                        .buttonStyle(BcubePrimaryButtonStyle())

                        if showRegister {
                            Button("Registrieren", action: onRegister)
                                .buttonStyle(BcubeSecondaryButtonStyle())
                        }
                    }
                }
                Spacer(minLength: 20)
            }
            .frame(maxWidth: .infinity)
            .padding(.horizontal, 20)
            .padding(.vertical, 30)
        }
        .scrollBounceBehavior(.basedOnSize, axes: .vertical)
        .bcubeBackground()
        .navigationBarBackButtonHidden(true)
    }
}
