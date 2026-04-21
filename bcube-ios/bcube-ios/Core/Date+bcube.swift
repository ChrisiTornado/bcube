import Foundation

private enum BcubeDateFormatter {
    static let viennaTimeZone = TimeZone(identifier: "Europe/Vienna") ?? .current

    static let bookingDate: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "de_AT")
        formatter.timeZone = viennaTimeZone
        formatter.dateFormat = "dd.MM.yyyy"
        return formatter
    }()

    static let formattedDate: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "de_AT")
        formatter.timeZone = viennaTimeZone
        formatter.dateFormat = "dd. MMMM, yyyy"
        return formatter
    }()

    static let monthTitle: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "de_AT")
        formatter.timeZone = viennaTimeZone
        formatter.dateFormat = "LLLL yyyy"
        return formatter
    }()

    static let longWeekdayDate: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "de_AT")
        formatter.timeZone = viennaTimeZone
        formatter.dateFormat = "EEEE, dd. MMMM yyyy"
        return formatter
    }()

    static let weekdayLabel: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "de_AT")
        formatter.timeZone = viennaTimeZone
        formatter.dateFormat = "EEE"
        return formatter
    }()

    static let viennaDayKey: DateFormatter = {
        let formatter = DateFormatter()
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = viennaTimeZone
        formatter.calendar = calendar
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = viennaTimeZone
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()

    static let isoDate: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()

    static let viennaTime: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "de_AT")
        formatter.timeZone = viennaTimeZone
        formatter.dateFormat = "HH:mm"
        return formatter
    }()

    static let backendDateTimeParsers: [DateFormatter] = {
        func makeISOFormatter(_ format: String) -> DateFormatter {
            let formatter = DateFormatter()
            formatter.locale = Locale(identifier: "en_US_POSIX")
            formatter.timeZone = TimeZone(secondsFromGMT: 0)
            formatter.dateFormat = format
            return formatter
        }

        let compact = DateFormatter()
        compact.locale = Locale(identifier: "en_US_POSIX")
        compact.timeZone = viennaTimeZone
        compact.dateFormat = "HH:mm:ss"

        let short = DateFormatter()
        short.locale = Locale(identifier: "en_US_POSIX")
        short.timeZone = viennaTimeZone
        short.dateFormat = "HH:mm"

        return [
            makeISOFormatter("yyyy-MM-dd'T'HH:mm:ss.SSSXXXXX"),
            makeISOFormatter("yyyy-MM-dd'T'HH:mm:ssXXXXX"),
            makeISOFormatter("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
            makeISOFormatter("yyyy-MM-dd'T'HH:mm:ss'Z'"),
            compact,
            short
        ]
    }()
}

extension Date {
    private var viennaCalendar: Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "Europe/Vienna") ?? .current
        return calendar
    }

    func viennaBookingDateString() -> String {
        BcubeDateFormatter.bookingDate.string(from: self)
    }

    func bcubeFormattedDate() -> String {
        BcubeDateFormatter.formattedDate.string(from: self)
    }

    func bcubeMonthTitle() -> String {
        BcubeDateFormatter.monthTitle.string(from: self)
    }

    func bcubeLongWeekdayDate() -> String {
        BcubeDateFormatter.longWeekdayDate.string(from: self)
    }

    func bcubeWeekdayLabel() -> String {
        BcubeDateFormatter.weekdayLabel.string(from: self)
    }

    func startOfMonth(using calendar: Calendar = .current) -> Date {
        let components = calendar.dateComponents([.year, .month], from: self)
        return calendar.date(from: components) ?? self
    }

    func isSameCalendarDay(as other: Date, using calendar: Calendar = .current) -> Bool {
        calendar.isDate(self, inSameDayAs: other)
    }

    func viennaDayKey() -> String {
        BcubeDateFormatter.viennaDayKey.string(from: self)
    }

    func isoDateString() -> String {
        BcubeDateFormatter.isoDate.string(from: self)
    }

    func viennaTimeString() -> String {
        BcubeDateFormatter.viennaTime.string(from: self)
    }

    func startOfViennaDay() -> Date {
        viennaCalendar.startOfDay(for: self)
    }

    func isBeforeTodayInVienna() -> Bool {
        startOfViennaDay() < Date().startOfViennaDay()
    }
}

extension String {
    func asISODate() -> Date? {
        let parts = split(separator: "-").compactMap { Int($0) }
        guard parts.count == 3 else { return nil }

        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "Europe/Vienna") ?? .current

        let components = DateComponents(
            timeZone: calendar.timeZone,
            year: parts[0],
            month: parts[1],
            day: parts[2],
            hour: 12,
            minute: 0,
            second: 0
        )

        return calendar.date(from: components)
    }

    func asBackendDateTime() -> Date? {
        BcubeDateFormatter.backendDateTimeParsers.compactMap { $0.date(from: self) }.first
    }

    func asViennaTimeMinutes() -> Int? {
        let parts = split(separator: ":")
            .compactMap { Int($0) }

        guard parts.count >= 2 else { return nil }
        return (parts[0] * 60) + parts[1]
    }
}
