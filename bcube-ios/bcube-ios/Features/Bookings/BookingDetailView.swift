import SwiftUI

struct BookingDetailView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    let bookingID: Int
    @StateObject private var viewModel: BookingDetailViewModel
    @State private var showCancelConfirmation = false

    init(bookingID: Int) {
        self.bookingID = bookingID
        _viewModel = StateObject(wrappedValue: BookingDetailViewModel(bookingID: bookingID))
    }

    var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(alignment: .leading, spacing: 18) {
                if viewModel.isLoading && viewModel.bookingDetails == nil {
                    BcubeLoadingScreen(message: "Buchungsdetails werden geladen")
                        .frame(height: 260)
                } else if let details = viewModel.bookingDetails {
                    hero(details)
                    info(details)
                    access(details)
                    action(details)
                } else if let errorMessage = viewModel.errorMessage {
                    EmptyStateCard(
                        title: "Buchungsdetails konnten nicht geladen werden",
                        message: errorMessage,
                        actionTitle: nil,
                        action: nil
                    )
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(20)
        }
        .scrollBounceBehavior(.basedOnSize, axes: .vertical)
        .bcubeBackground()
        .detailScreenChrome(title: "Buchung #\(bookingID)")
        .confirmationDialog(
            "Buchung wirklich stornieren?",
            isPresented: $showCancelConfirmation,
            titleVisibility: .visible
        ) {
            Button("Buchung stornieren", role: .destructive) {
                guard let token = sessionStore.currentToken else { return }
                Task {
                    await viewModel.cancel(token: token)
                }
            }

            Button("Abbrechen", role: .cancel) { }
        } message: {
            Text("Diese Aktion kann nicht direkt rückgängig gemacht werden.")
        }
        .task {
            if let token = sessionStore.currentToken {
                await viewModel.load(token: token)
            }
        }
    }

    private func hero(_ details: BookingDetails) -> some View {
        BcubeCard {
            VStack(alignment: .leading, spacing: 14) {
                Base64StudioImageView(
                    base64: details.studio.imageBase64,
                    fallbackIcon: "brand.logo",
                    contentMode: .fit,
                    imagePadding: 16,
                    panelCornerRadius: 24,
                    panelFill: Color.white.opacity(0.035)
                )
                    .frame(maxWidth: .infinity)
                    .frame(height: 164)
                    .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))

                HStack {
                    Text(details.studio.name)
                        .font(.system(size: 28, weight: .black, design: .rounded))
                    Spacer()
                    InlineStatusBadge(status: details.status)
                }
            }
        }
    }

    private func info(_ details: BookingDetails) -> some View {
        BcubeCard {
            VStack(alignment: .leading, spacing: 10) {
                Text("Auftragsinformationen")
                    .font(.headline.weight(.bold))

                detailRow("Datum", details.booking.dateValue?.bcubeFormattedDate() ?? details.date)
                detailRow("Zeit", details.booking.timeLabel)
                detailRow("Adresse", details.studio.fullAddress)
                detailRow("Land", details.studio.country)
            }
        }
    }

    private func access(_ details: BookingDetails) -> some View {
        BcubeCard {
            VStack(alignment: .leading, spacing: 10) {
                Text("Zutritt")
                    .font(.headline.weight(.bold))

                detailRow("Zutrittscode", details.accessCode)

                if let infoMessage = viewModel.infoMessage {
                    Text(infoMessage)
                        .foregroundStyle(.green)
                        .font(.footnote.weight(.semibold))
                }

                if let errorMessage = viewModel.errorMessage {
                    Text(errorMessage)
                        .foregroundStyle(BcubeTheme.Colors.danger)
                        .font(.footnote.weight(.semibold))
                }
            }
        }
    }

    private func action(_ details: BookingDetails) -> some View {
        Group {
            if details.status == .confirmed || details.status == .pending {
                Button {
                    showCancelConfirmation = true
                } label: {
                    if viewModel.isLoading {
                        ProgressView().tint(.black)
                    } else {
                        Text("Buchung stornieren")
                    }
                }
                .buttonStyle(BcubePrimaryButtonStyle())
            }
        }
    }

    private func detailRow(_ title: String, _ value: String) -> some View {
        HStack(alignment: .top, spacing: 16) {
            Text(title)
                .foregroundStyle(BcubeTheme.Colors.textSecondary)
                .frame(width: 92, alignment: .leading)
            Text(value)
                .frame(maxWidth: .infinity, alignment: .trailing)
                .multilineTextAlignment(.trailing)
        }
        .font(.subheadline)
    }
}
