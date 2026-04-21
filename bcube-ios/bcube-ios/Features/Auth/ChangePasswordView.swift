import SwiftUI

struct ChangePasswordView: View {
    let email: String
    let onSuccess: () -> Void
    @StateObject private var viewModel = ChangePasswordViewModel()

    var body: some View {
        VStack(spacing: 24) {
            BcubeCard {
                VStack(alignment: .leading, spacing: 18) {
                    Text("Neues Passwort")
                        .font(.system(size: 26, weight: .black, design: .rounded))

                    SecureField("Neues Passwort", text: $viewModel.password)
                        .bcubeTextField()

                    SecureField("Passwort wiederholen", text: $viewModel.confirmPassword)
                        .bcubeTextField()

                    if let errorMessage = viewModel.errorMessage {
                        Text(errorMessage)
                            .font(.footnote.weight(.semibold))
                            .foregroundStyle(BcubeTheme.Colors.accent)
                    }

                    if let successMessage = viewModel.successMessage {
                        Text(successMessage)
                            .font(.footnote.weight(.semibold))
                            .foregroundStyle(.green)
                    }

                    Button {
                        Task {
                            await viewModel.submit(email: email, onSuccess: onSuccess)
                        }
                    } label: {
                        if viewModel.isLoading {
                            ProgressView().tint(.black)
                        } else {
                            Text("Passwort speichern")
                        }
                    }
                    .buttonStyle(BcubePrimaryButtonStyle())
                }
            }
            Spacer()
        }
        .padding(20)
        .bcubeBackground()
        .detailScreenChrome(title: "Passwort ändern")
    }
}
