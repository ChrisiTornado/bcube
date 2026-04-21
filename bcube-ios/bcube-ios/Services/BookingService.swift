import Foundation

struct BookingService {
    private let network = NetworkService.shared

    func getBookings(for userID: Int, studioID: Int? = nil, page: Int = 0, size: Int = 10, token: String) async throws -> PageResponse<Booking> {
        var query = [
            URLQueryItem(name: "userId", value: String(userID)),
            URLQueryItem(name: "page", value: String(page)),
            URLQueryItem(name: "size", value: String(size))
        ]
        if let studioID {
            query.append(URLQueryItem(name: "studioId", value: String(studioID)))
        }

        let envelope: APIEnvelope<PageResponse<Booking>> = try await network.request(
            path: "/api/bookings/user/\(userID)",
            method: .get,
            queryItems: query,
            requiresAuth: true,
            token: token
        )
        return envelope.data
    }

    func getBookingsForStudio(studioID: Int, token: String) async throws -> [Booking] {
        let envelope: APIEnvelope<[Booking]> = try await network.request(path: "/api/bookings/studio/\(studioID)", requiresAuth: true, token: token)
        return envelope.data
    }

    func getBookingDetails(id: Int, token: String) async throws -> BookingDetails {
        let envelope: APIEnvelope<BookingDetails> = try await network.request(path: "/api/bookings/\(id)", requiresAuth: true, token: token)
        return envelope.data
    }

    func createBooking(payload: CreateBookingRequest, token: String) async throws -> (BookingDetails, String) {
        let envelope: APIEnvelope<BookingDetails> = try await network.request(
            path: "/api/bookings",
            method: .post,
            body: payload,
            requiresAuth: true,
            token: token
        )
        return (envelope.data, envelope.message)
    }

    func cancelBooking(id: Int, token: String) async throws -> String {
        let envelope: APIMessageEnvelope = try await network.request(
            path: "/api/bookings/\(id)",
            method: .delete,
            requiresAuth: true,
            token: token
        )
        return envelope.message
    }

    func getAllBookingsForUser(userID: Int, studioID: Int? = nil, pageSize: Int = 50, token: String) async throws -> [Booking] {
        var page = 0
        var allBookings: [Booking] = []
        var reachedLastPage = false

        while !reachedLastPage {
            let response = try await getBookings(for: userID, studioID: studioID, page: page, size: pageSize, token: token)
            allBookings += response.content
            reachedLastPage = response.last ?? (page >= max(0, response.totalPages - 1))
            page += 1
        }

        return allBookings
    }
}
