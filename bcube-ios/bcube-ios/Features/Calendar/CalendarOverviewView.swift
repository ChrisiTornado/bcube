import Combine
import SwiftUI

enum CalendarEmptyState {
    case none
    case noBookingsInMonth
    case noBookingsOnDay
}

@MainActor
final class CalendarOverviewViewModel: ObservableObject {
    @Published var bookings: [Booking] = []
    @Published var selectedDate = Date()
    @Published var displayedMonth = Date().startOfMonth()
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published private(set) var markedDates: Set<String> = []
    @Published private(set) var selectedDayBookings: [Booking] = []
    @Published private(set) var emptyState: CalendarEmptyState = .none

    private let bookingService = BookingService()

    func load(userID: Int, token: String) async {
        isLoading = true
        defer { isLoading = false }
        errorMessage = nil

        do {
            bookings = try await bookingService.getAllBookingsForUser(userID: userID, pageSize: 50, token: token)
                .filter { $0.status == .confirmed }
                .sorted {
                    ($0.dateValue ?? .distantPast, $0.startTime) < ($1.dateValue ?? .distantPast, $1.startTime)
                }
            markedDates = Set(bookings.map(\.dayKey))
        } catch {
            bookings = []
            markedDates = []
            errorMessage = error.localizedDescription
        }

        displayedMonth = Date().startOfMonth()
        applyMonthSelection(for: displayedMonth, direction: 0)
    }

    var emptyStateTitle: String {
        switch emptyState {
        case .none:
            return ""
        case .noBookingsInMonth:
            return "Keine Buchungen in diesem Monat"
        case .noBookingsOnDay:
            return "Keine Buchungen an diesem Tag"
        }
    }

    var emptyStateMessage: String {
        switch emptyState {
        case .none:
            return ""
        case .noBookingsInMonth:
            return "In diesem Monat gibt es keine bestätigten Sessions."
        case .noBookingsOnDay:
            return "Wähle einen markierten Tag, um deine bestätigten Sessions zu sehen."
        }
    }

    func updateSelectedDate(_ date: Date) {
        selectedDate = date.startOfViennaDay()
        displayedMonth = selectedDate.startOfMonth()
        updateSelectedDayBookings()
        emptyState = selectedDayBookings.isEmpty ? .noBookingsOnDay : .none
    }

    func updateDisplayedMonth(_ month: Date, direction: Int) {
        let normalizedMonth = month.startOfMonth()
        displayedMonth = normalizedMonth
        applyMonthSelection(for: normalizedMonth, direction: direction)
    }

    private func applyMonthSelection(for month: Date, direction: Int) {
        let calendar = Calendar.current
        let today = Date().startOfViennaDay()
        let currentMonth = today.startOfMonth()
        let monthDates = bookings
            .compactMap(\.dateValue)
            .filter { calendar.isDate($0, equalTo: month, toGranularity: .month) }
            .sorted()

        let targetDate: Date?
        if calendar.isDate(month, equalTo: currentMonth, toGranularity: .month) {
            targetDate = monthDates.first(where: { $0 >= today })
        } else if direction < 0 {
            targetDate = monthDates.last
        } else {
            targetDate = monthDates.first
        }

        if let targetDate {
            selectedDate = targetDate.startOfViennaDay()
            updateSelectedDayBookings()
            emptyState = selectedDayBookings.isEmpty ? .noBookingsOnDay : .none
        } else {
            selectedDate = month.startOfViennaDay()
            selectedDayBookings = []
            emptyState = .noBookingsInMonth
        }
    }

    private func updateSelectedDayBookings() {
        let selectedKey = selectedDate.viennaDayKey()
        selectedDayBookings = bookings.filter { $0.dayKey == selectedKey }
    }
}

struct CalendarOverviewView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    @StateObject private var viewModel = CalendarOverviewViewModel()

    var body: some View {
        Group {
            if viewModel.isLoading && viewModel.bookings.isEmpty {
                BcubeLoadingScreen(message: "Kalender wird geladen")
            } else {
                ScrollView(.vertical, showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 18) {
                        BcubeCard {
                            BookingMonthCalendarView(
                                month: viewModel.displayedMonth,
                                selectedDate: Binding(
                                    get: { viewModel.selectedDate },
                                    set: { viewModel.updateSelectedDate($0) }
                                ),
                                markedDates: viewModel.markedDates,
                                blockedDates: [],
                                onMonthChange: { month, direction in
                                    viewModel.updateDisplayedMonth(month, direction: direction)
                                }
                            )
                        }

                        if let errorMessage = viewModel.errorMessage {
                            EmptyStateCard(
                                title: "Kalender konnte nicht geladen werden",
                                message: errorMessage,
                                actionTitle: nil,
                                action: nil
                            )
                        } else if viewModel.selectedDayBookings.isEmpty {
                            EmptyStateCard(
                                title: viewModel.emptyStateTitle,
                                message: viewModel.emptyStateMessage,
                                actionTitle: nil,
                                action: nil
                            )
                        } else {
                            ForEach(viewModel.selectedDayBookings) { booking in
                                NavigationLink(value: booking.id) {
                                    BookingRowView(booking: booking)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(20)
                }
                .scrollBounceBehavior(.basedOnSize, axes: .vertical)
            }
        }
        .bcubeBackground()
        .rootTabChrome(title: "Kalender")
        .navigationDestination(for: Int.self) { bookingID in
            BookingDetailView(bookingID: bookingID)
        }
        .task {
            guard let userID = sessionStore.currentUser?.id,
                  let token = sessionStore.currentToken else { return }
            await viewModel.load(userID: userID, token: token)
        }
    }
}
