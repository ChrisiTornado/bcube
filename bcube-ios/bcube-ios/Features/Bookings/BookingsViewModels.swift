import Combine
import Foundation

@MainActor
final class BookingsListViewModel: ObservableObject {
    @Published var bookings: [Booking] = []
    @Published var filters: [StudioFilter] = []
    @Published var selectedStudioID: Int?
    @Published var isLoading = false
    @Published var totalPages = 1
    @Published var page = 0
    @Published var errorMessage: String?

    private let bookingService = BookingService()
    private let studioService = StudioService()

    func load(userID: Int, token: String) async {
        isLoading = true
        defer { isLoading = false }
        errorMessage = nil

        do {
            async let filterValues = studioService.getAllStudioFilters(token: token)
            async let response = bookingService.getBookings(for: userID, studioID: selectedStudioID, page: page, size: 20, token: token)

            filters = try await filterValues
            let pageResponse = try await response
            bookings = pageResponse.content
            totalPages = max(1, pageResponse.totalPages)
            if page >= totalPages {
                page = max(0, totalPages - 1)
            }
        } catch {
            bookings = []
            filters = []
            totalPages = 1
            page = 0
            errorMessage = error.localizedDescription
        }
    }

    func resetFilters() {
        selectedStudioID = nil
        page = 0
    }

    var canGoBackward: Bool {
        page > 0
    }

    var canGoForward: Bool {
        page < totalPages - 1
    }

    func goToPreviousPage() {
        guard canGoBackward else { return }
        page -= 1
    }

    func goToNextPage() {
        guard canGoForward else { return }
        page += 1
    }
}

@MainActor
final class BookingDetailViewModel: ObservableObject {
    @Published var bookingDetails: BookingDetails?
    @Published var isLoading = false
    @Published var infoMessage: String?
    @Published var errorMessage: String?

    private let service = BookingService()
    private let bookingID: Int

    init(bookingID: Int) {
        self.bookingID = bookingID
    }

    func load(token: String) async {
        isLoading = true
        defer { isLoading = false }
        errorMessage = nil
        do {
            bookingDetails = try await service.getBookingDetails(id: bookingID, token: token)
        } catch {
            bookingDetails = nil
            errorMessage = error.localizedDescription
        }
    }

    func cancel(token: String) async {
        guard bookingDetails != nil else { return }
        isLoading = true
        defer { isLoading = false }
        errorMessage = nil
        infoMessage = nil
        do {
            infoMessage = try await service.cancelBooking(id: bookingID, token: token)
            if var bookingDetails {
                bookingDetails = BookingDetails(
                    id: bookingDetails.id,
                    user: bookingDetails.user,
                    studio: bookingDetails.studio,
                    date: bookingDetails.date,
                    startTime: bookingDetails.startTime,
                    endTime: bookingDetails.endTime,
                    status: .cancelled,
                    accessCode: bookingDetails.accessCode
                )
                self.bookingDetails = bookingDetails
            }
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
