import SwiftUI

struct RegisterView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    @StateObject private var viewModel = RegisterViewModel()
    let onLogin: () -> Void

    var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(spacing: 24) {
                BrandBadgeView()

                BcubeCard {
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Registrieren")
                            .font(.system(size: 28, weight: .black, design: .rounded))

                        TextField("E-Mail-Adresse", text: $viewModel.email)
                            .textInputAutocapitalization(.never)
                            .keyboardType(.emailAddress)
                            .bcubeTextField()

                        SecureField("Passwort", text: $viewModel.password)
                            .bcubeTextField()

                        HStack(spacing: 12) {
                            TextField("Vorname", text: $viewModel.firstName)
                                .bcubeTextField()
                            TextField("Nachname", text: $viewModel.lastName)
                                .bcubeTextField()
                        }

                        TextField("Telefonnummer", text: $viewModel.phone)
                            .keyboardType(.phonePad)
                            .bcubeTextField()

                        Toggle(isOn: $viewModel.acceptTerms) {
                            Text("Ich stimme den AGB zu.")
                                .foregroundStyle(BcubeTheme.Colors.textSecondary)
                                .font(.footnote)
                        }
                        .toggleStyle(.switch)
                        .tint(BcubeTheme.Colors.accent)

                        if let errorMessage = viewModel.errorMessage {
                            Text(errorMessage)
                                .font(.footnote.weight(.semibold))
                                .foregroundStyle(BcubeTheme.Colors.accent)
                        }

                        Button {
                            Task {
                                await viewModel.submit(sessionStore: sessionStore)
                            }
                        } label: {
                            if viewModel.isLoading {
                                ProgressView().tint(.black)
                            } else {
                                Text("Registrieren")
                            }
                        }
                        .buttonStyle(BcubePrimaryButtonStyle())

                        Button("Zurück zum Login", action: onLogin)
                            .buttonStyle(BcubeSecondaryButtonStyle())
                    }
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.horizontal, 20)
            .padding(.vertical, 30)
        }
        .scrollBounceBehavior(.basedOnSize, axes: .vertical)
        .bcubeBackground()
    }
}
