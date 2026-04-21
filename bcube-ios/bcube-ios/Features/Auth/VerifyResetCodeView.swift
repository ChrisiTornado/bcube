import SwiftUI

struct VerifyResetCodeView: View {
    let email: String
    let onSuccess: () -> Void
    @StateObject private var viewModel = VerifyCodeViewModel()
    @FocusState private var focusedIndex: Int?

    var body: some View {
        VStack(spacing: 24) {
            BcubeCard {
                VStack(alignment: .leading, spacing: 18) {
                    Text("Code bestätigen")
                        .font(.system(size: 26, weight: .black, design: .rounded))

                    Text("Wir prüfen den 6-stelligen Code für \(email).")
                        .foregroundStyle(BcubeTheme.Colors.textSecondary)

                    HStack(spacing: 10) {
                        ForEach(0..<6, id: \.self) { index in
                            TextField("", text: digitBinding(for: index))
                                .keyboardType(.numberPad)
                                .multilineTextAlignment(.center)
                                .textContentType(.oneTimeCode)
                                .focused($focusedIndex, equals: index)
                                .frame(width: 44, height: 54)
                                .background(
                                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                                        .fill(Color.white.opacity(0.08))
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 16, style: .continuous)
                                                .stroke(BcubeTheme.Colors.panelStroke, lineWidth: 1)
                                        )
                                )
                        }
                    }

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
                            await viewModel.resendCode(email: email)
                        }
                    } label: {
                        if viewModel.isResending {
                            ProgressView()
                                .tint(BcubeTheme.Colors.accent)
                        } else {
                            Text("Code erneut senden")
                        }
                    }
                    .font(.footnote.weight(.bold))
                    .foregroundStyle(BcubeTheme.Colors.accent)

                    Button {
                        Task {
                            await viewModel.submit(email: email, onSuccess: onSuccess)
                        }
                    } label: {
                        if viewModel.isLoading {
                            ProgressView().tint(.black)
                        } else {
                            Text("Code prüfen")
                        }
                    }
                    .buttonStyle(BcubePrimaryButtonStyle())
                }
            }
            Spacer()
        }
        .padding(20)
        .bcubeBackground()
        .detailScreenChrome(title: "Code eingeben")
        .onAppear {
            focusedIndex = 0
        }
    }

    private func digitBinding(for index: Int) -> Binding<String> {
        Binding(
            get: {
                viewModel.digits[index]
            },
            set: { newValue in
                let digitsOnly = newValue.filter(\.isNumber)
                let previousValue = viewModel.digits[index]

                if digitsOnly.isEmpty {
                    viewModel.digits[index] = ""
                    if !previousValue.isEmpty, index > 0 {
                        focusedIndex = index - 1
                    }
                    return
                }

                if digitsOnly.count > 1 {
                    applyPastedDigits(Array(digitsOnly.prefix(6)), startingAt: index)
                    return
                }

                viewModel.digits[index] = String(digitsOnly.prefix(1))
                if index < 5 {
                    focusedIndex = index + 1
                } else {
                    focusedIndex = nil
                }
            }
        )
    }

    private func applyPastedDigits(_ digits: [Character], startingAt startIndex: Int) {
        guard !digits.isEmpty else { return }

        var targetIndex = startIndex
        for digit in digits {
            guard targetIndex < viewModel.digits.count else { break }
            viewModel.digits[targetIndex] = String(digit)
            targetIndex += 1
        }

        if targetIndex < viewModel.digits.count {
            focusedIndex = targetIndex
        } else {
            focusedIndex = nil
        }
    }
}
