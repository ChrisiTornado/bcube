import SwiftUI

struct BookingsListView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    @StateObject private var viewModel = BookingsListViewModel()
    private let topAnchorID = "bookings-top-anchor"

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView(.vertical, showsIndicators: false) {
                VStack(alignment: .leading, spacing: 18) {
                    Color.clear
                        .frame(height: 1)
                        .id(topAnchorID)

                    if !viewModel.filters.isEmpty {
                        filters
                    }

                    if viewModel.isLoading {
                        BcubeLoadingScreen(message: "Buchungen werden geladen")
                            .frame(height: 200)
                    } else if let errorMessage = viewModel.errorMessage {
                        EmptyStateCard(
                            title: "Buchungen konnten nicht geladen werden",
                            message: errorMessage,
                            actionTitle: nil,
                            action: nil
                        )
                    } else if viewModel.bookings.isEmpty {
                        EmptyStateCard(
                            title: "Keine Buchungen gefunden",
                            message: "Sobald du einen Cube buchst, erscheint er hier. Mit dem Filter kannst du später gezielt nach Standorten suchen.",
                            actionTitle: "Zu den Cubes",
                            action: nil
                        )
                    } else {
                        LazyVStack(spacing: 14) {
                            ForEach(viewModel.bookings) { booking in
                                NavigationLink(value: booking.id) {
                                    BookingRowView(booking: booking)
                                }
                                .buttonStyle(.plain)
                            }
                        }

                        PaginationFooter(
                            currentPage: viewModel.page,
                            totalPages: viewModel.totalPages,
                            canGoBackward: viewModel.canGoBackward,
                            canGoForward: viewModel.canGoForward,
                            isLoading: viewModel.isLoading,
                            onPrevious: {
                                withAnimation(.easeInOut(duration: 0.22)) {
                                    proxy.scrollTo(topAnchorID, anchor: .top)
                                }
                                viewModel.goToPreviousPage()
                                Task { await reload() }
                            },
                            onNext: {
                                withAnimation(.easeInOut(duration: 0.22)) {
                                    proxy.scrollTo(topAnchorID, anchor: .top)
                                }
                                viewModel.goToNextPage()
                                Task { await reload() }
                            }
                        )
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(20)
            }
            .scrollBounceBehavior(.basedOnSize, axes: .vertical)
        }
        .bcubeBackground()
        .rootTabChrome(title: "Buchungen")
        .navigationDestination(for: Int.self) { bookingID in
            BookingDetailView(bookingID: bookingID)
        }
        .task {
            await reload()
        }
        .onChange(of: viewModel.selectedStudioID) { _, _ in
            Task { await reload() }
        }
    }

    private var filters: some View {
        BcubeCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 10) {
                    Image(systemName: "line.3.horizontal.decrease.circle.fill")
                        .foregroundStyle(BcubeTheme.Colors.accent)

                    Picker("Cube", selection: $viewModel.selectedStudioID) {
                        Text("Alle Cubes").tag(Optional<Int>.none)
                        ForEach(viewModel.filters) { filter in
                            Text(filter.name).tag(Optional(filter.id))
                        }
                    }
                    .pickerStyle(.menu)
                    .frame(maxWidth: .infinity, alignment: .leading)

                }

                if viewModel.selectedStudioID != nil {
                    Button("Filter zurücksetzen") {
                        viewModel.resetFilters()
                        Task { await reload() }
                    }
                    .font(.footnote.weight(.bold))
                    .foregroundStyle(BcubeTheme.Colors.accent)
                }
            }
        }
    }

    private func reload() async {
        guard let userID = sessionStore.currentUser?.id,
              let token = sessionStore.currentToken else { return }
        await viewModel.load(userID: userID, token: token)
    }
}

struct BookingRowView: View {
    let booking: Booking

    var body: some View {
        BcubeCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text("Buchung #\(booking.id)")
                        .font(.headline.weight(.bold))
                    Spacer()
                    InlineStatusBadge(status: booking.status)
                }

                Text(booking.studio.name)
                    .foregroundStyle(BcubeTheme.Colors.textPrimary)

                HStack {
                    Label(booking.dateValue?.bcubeFormattedDate() ?? booking.date, systemImage: "calendar")
                    Spacer()
                    Label(booking.timeLabel, systemImage: "clock")
                }
                .font(.footnote)
                .foregroundStyle(BcubeTheme.Colors.textSecondary)
            }
        }
    }
}
