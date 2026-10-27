import Foundation

enum BookingStatus: String, Codable, CaseIterable, Hashable {
    case confirmed = "CONFIRMED"
    case cancelled = "CANCELLED"
    case done = "DONE"
    case pending = "PENDING"
    case failed = "FAILED"

    var label: String {
        switch self {
        case .confirmed: return "Bestätigt"
        case .cancelled: return "Storniert"
        case .done: return "Abgeschlossen"
        case .pending: return "Ausstehend"
        case .failed: return "Fehlgeschlagen"
        }
    }
}

/// Shared date/time helpers for anything that occupies a studio time range - a full `Booking`
/// as well as the anonymous `BookedSlot` from the public occupancy endpoint.
protocol BookingTimeRange {
    var date: String { get }
    var startTime: String { get }
    var endTime: String { get }
}

extension BookingTimeRange {
    var dateValue: Date? {
        date.asISODate()
    }

    var dayKey: String {
        if date.count == 10, date.contains("-") {
            return date
        }
        return dateValue?.viennaDayKey() ?? date
    }

    var startDateValue: Date? {
        startTime.asBackendDateTime()
    }

    var endDateValue: Date? {
        endTime.asBackendDateTime()
    }

    var timeLabel: String {
        "\(formattedTime(startTime)) - \(formattedTime(endTime))"
    }

    var startTimeLabel: String {
        formattedTime(startTime)
    }

    var endTimeLabel: String {
        formattedTime(endTime)
    }

    private func formattedTime(_ value: String) -> String {
        if let date = value.asBackendDateTime() {
            return date.viennaTimeString()
        }

        if let range = value.range(of: #"\b\d{2}:\d{2}\b"#, options: .regularExpression) {
            return String(value[range])
        }

        return value
    }
}

struct Booking: Codable, Identifiable, Hashable, BookingTimeRange {
    let id: Int
    let studio: Studio
    let user: User
    let date: String
    let startTime: String
    let endTime: String
    let status: BookingStatus
}

/// Anonymous occupancy of a studio (GET /api/bookings/studio/{id}/slots) - no booking id or user,
/// so the identity for SwiftUI lists is derived from the time range itself.
struct BookedSlot: Codable, Identifiable, Hashable, BookingTimeRange {
    let date: String
    let startTime: String
    let endTime: String
    let status: BookingStatus

    var id: String {
        "\(date)|\(startTime)|\(endTime)"
    }
}

struct BookingDetails: Codable, Identifiable, Hashable {
    let id: Int
    let user: User
    let studio: Studio
    let date: String
    let startTime: String
    let endTime: String
    let status: BookingStatus
    let accessCode: String

    var booking: Booking {
        Booking(id: id, studio: studio, user: user, date: date, startTime: startTime, endTime: endTime, status: status)
    }
}
