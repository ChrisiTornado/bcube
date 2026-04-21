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

struct Booking: Codable, Identifiable, Hashable {
    let id: Int
    let studio: Studio
    let user: User
    let date: String
    let startTime: String
    let endTime: String
    let status: BookingStatus

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
