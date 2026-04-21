import SwiftUI

struct EmailResetView: View {
    @StateObject private var viewModel = PasswordResetEmailViewModel()
    let onSuccess: (String) -> Void

    var body: some View {
        VStack(spacing: 24) {
            BcubeCard {
                VStack(alignment: .leading, spacing: 18) {
                    Text("Reset starten")
                        .font(.system(size: 26, weight: .black, design: .rounded))

                    Text("Gib die E-Mail-Adresse deines Accounts ein. Danach kannst du den Code bestätigen und ein neues Passwort vergeben.")
                        .foregroundStyle(BcubeTheme.Colors.textSecondary)

                    TextField("E-Mail-Adresse", text: $viewModel.email)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .bcubeTextField()

                    if let infoMessage = viewModel.infoMessage {
                        Text(infoMessage)
                            .font(.footnote.weight(.semibold))
                            .foregroundStyle(.green)
                    }

                    if let errorMessage = viewModel.errorMessage {
                        Text(errorMessage)
                            .font(.footnote.weight(.semibold))
                            .foregroundStyle(BcubeTheme.Colors.accent)
                    }

                    Button {
                        Task {
                            await viewModel.submit(onSuccess: onSuccess)
                        }
                    } label: {
                        if viewModel.isLoading {
                            ProgressView().tint(.black)
                        } else {
                            Text("Code anfordern")
                        }
                    }
                    .buttonStyle(BcubePrimaryButtonStyle())
                }
            }
            Spacer()
        }
        .padding(20)
        .bcubeBackground()
        .detailScreenChrome(title: "Passwort vergessen")
    }
}
