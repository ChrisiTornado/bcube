import Combine
import Foundation

private struct MinuteRange: Hashable {
    let start: Int
    let end: Int

    func overlaps(start otherStart: Int, end otherEnd: Int) -> Bool {
        max(start, otherStart) < min(end, otherEnd)
    }
}

@MainActor
final class StudiosListViewModel: ObservableObject {
    @Published var studios: [Studio] = []
    @Published var isLoading = false
    @Published var currentPage = 0
    @Published var totalPages = 1
    @Published var errorMessage: String?

    private let service = StudioService()
    private let pageSize = 10

    func loadInitial(token: String) async {
        currentPage = 0
        await load(page: 0, token: token)
    }

    func loadCurrentPage(token: String) async {
        await load(page: currentPage, token: token)
    }

    func goToPreviousPage(token: String) async {
        guard currentPage > 0 else { return }
        await load(page: currentPage - 1, token: token)
    }

    func goToNextPage(token: String) async {
        guard currentPage < totalPages - 1 else { return }
        await load(page: currentPage + 1, token: token)
    }

    private func load(page: Int, token: String) async {
        isLoading = true
        defer { isLoading = false }
        errorMessage = nil

        do {
            let response = try await service.getStudios(page: page, size: pageSize, token: token)
            currentPage = page
            totalPages = max(1, response.totalPages)
            studios = response.content
        } catch {
            studios = []
            errorMessage = error.localizedDescription
        }
    }
}

@MainActor
final class StudioDetailViewModel: ObservableObject {
    @Published var studio: Studio
    @Published var bookings: [Booking] = []
    @Published var selectedDate = Date()
    @Published var selectedStartSlot = "12:00"
    @Published var selectedEndSlot = "15:00"
    @Published private(set) var dayBookings: [Booking] = []
    @Published private(set) var markedDates: Set<String> = []
    @Published private(set) var fullyBookedDates: Set<String> = []
    @Published private(set) var availableStartSlots: [String] = []
    @Published private(set) var availableEndSlots: [String] = []
    @Published private(set) var unavailableTimeRanges: [String] = []
    @Published private(set) var validationMessage: String?
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var createdBooking: BookingDetails?
    @Published var infoMessage: String?
    @Published private(set) var shouldRefreshAfterBookingFlow = false

    private let bookingService = BookingService()
    private let studioService = StudioService()
    private let allQuarterHourSlots = stride(from: 0, through: 23 * 60 + 45, by: 15).map { totalMinutes in
        String(format: "%02d:%02d", totalMinutes / 60, totalMinutes % 60)
    }
    private var cachedBookingsByDate: [String: [Booking]] = [:]
    private var cachedBookedRangesByDate: [String: [MinuteRange]] = [:]
    private var cachedAvailableStartSlotsByDate: [String: [String]] = [:]
    private var cachedAvailableEndSlotsByDate: [String: [String: [String]]] = [:]
    private var cachedUnavailableTimeRangesByDate: [String: [String]] = [:]

    init(studio: Studio) {
        self.studio = studio
        selectedDate = Date().startOfViennaDay()
    }

    func load(token: String) async {
        isLoading = true
        defer { isLoading = false }
        errorMessage = nil

        do {
            async let latestStudio = studioService.getStudio(by: studio.id, token: token)
            async let studioBookings = bookingService.getBookingsForStudio(studioID: studio.id, token: token)

            studio = try await latestStudio
            bookings = try await studioBookings
                .filter { $0.status == .confirmed || $0.status == .pending }
            rebuildBookingCaches()
            resetSelectionToDefault()
            recalculateDerivedState()
        } catch {
            bookings = []
            errorMessage = error.localizedDescription
            rebuildBookingCaches()
            recalculateDerivedState()
        }
    }

    func updateSelectedDate(_ date: Date) {
        selectedDate = max(date.startOfViennaDay(), Date().startOfViennaDay())
        resetSelectionToDefault()
        recalculateDerivedState()
    }

    func updateSelectedStartSlot(_ slot: String) {
        selectedStartSlot = slot
        validationMessage = buildValidationMessage(for: selectedDate.viennaDayKey())
    }

    func updateSelectedEndSlot(_ slot: String) {
        selectedEndSlot = slot
        validationMessage = buildValidationMessage(for: selectedDate.viennaDayKey())
    }

    func createBooking(user: User, token: String) async {
        guard canBook else {
            errorMessage = validationMessage
            return
        }

        let payload = CreateBookingRequest(
            userID: user.id,
            studioID: studio.id,
            date: selectedDate.viennaBookingDateString(),
            startTime: selectedStartSlot,
            endTime: selectedEndSlot
        )

        isLoading = true
        defer { isLoading = false }
        errorMessage = nil
        infoMessage = nil

        do {
            let result = try await bookingService.createBooking(payload: payload, token: token)
            shouldRefreshAfterBookingFlow = true
            createdBooking = result.0
            infoMessage = result.1
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func clearBookingFlowState() {
        shouldRefreshAfterBookingFlow = false
        createdBooking = nil
    }

    var canBook: Bool {
        validationMessage == nil
    }

    private func resetSelectionToDefault() {
        selectedStartSlot = "12:00"
        selectedEndSlot = "15:00"
    }

    private func recalculateDerivedState() {
        let selectedKey = selectedDate.viennaDayKey()

        dayBookings = cachedBookingsByDate[selectedKey] ?? []
        availableStartSlots = allQuarterHourSlots
        availableEndSlots = allQuarterHourSlots
        unavailableTimeRanges = cachedUnavailableTimeRangesByDate[selectedKey] ?? []
        validationMessage = buildValidationMessage(for: selectedKey)
    }

    private func buildValidationMessage(for dayKey: String) -> String? {
        if selectedDate.isBeforeTodayInVienna() {
            return "Buchungen in der Vergangenheit sind nicht möglich."
        }

        if fullyBookedDates.contains(dayKey) {
            return "Dieser Tag ist bereits vollständig ausgebucht."
        }

        guard let selectedRange = slotRange(start: selectedStartSlot, end: selectedEndSlot, on: selectedDate) else {
            return "Die Endzeit muss nach der Startzeit liegen."
        }

        guard selectedRange.lowerBound > Date() else {
            return "Buchungen in der Vergangenheit sind nicht möglich."
        }

        let selectedStart = selectedStartSlot.asViennaTimeMinutes() ?? 0
        let selectedEnd = selectedEndSlot.asViennaTimeMinutes() ?? 0
        let overlap = (cachedBookedRangesByDate[dayKey] ?? []).contains {
            $0.overlaps(start: selectedStart, end: selectedEnd)
        }

        if overlap {
            return "Der gewählte Zeitraum überschneidet sich mit einer bestehenden Buchung."
        }

        return nil
    }

    private func availableEndSlots(for startSlot: String) -> [String] {
        cachedAvailableEndSlotsByDate[selectedDate.viennaDayKey()]?[startSlot] ?? []
    }

    private func rebuildBookingCaches() {
        cachedBookingsByDate = Dictionary(grouping: bookings, by: \.dayKey)
            .mapValues { $0.sorted { $0.startTime < $1.startTime } }

        markedDates = Set(cachedBookingsByDate.keys)
        cachedBookedRangesByDate = [:]
        cachedAvailableStartSlotsByDate = [:]
        cachedAvailableEndSlotsByDate = [:]
        cachedUnavailableTimeRangesByDate = [:]
        fullyBookedDates = Set<String>()

        for (dayKey, dayBookings) in cachedBookingsByDate {
            let targetDate = (dayBookings.first?.dateValue ?? selectedDate).startOfViennaDay()

            let bookedRanges: [MinuteRange] = dayBookings.compactMap { booking -> MinuteRange? in
                guard let start = booking.startTimeLabel.asViennaTimeMinutes(),
                      let end = booking.endTimeLabel.asViennaTimeMinutes(),
                      end > start else {
                    return nil
                }

                return MinuteRange(start: start, end: end)
            }

            cachedBookedRangesByDate[dayKey] = bookedRanges
            cachedUnavailableTimeRangesByDate[dayKey] = dayBookings.map(\.timeLabel)

            var endSlotsByStart: [String: [String]] = [:]
            var startSlots: [String] = []

            for startSlot in allQuarterHourSlots {
                let availableEnds = availableEndSlots(
                    for: startSlot,
                    on: targetDate,
                    bookedRanges: bookedRanges
                )

                endSlotsByStart[startSlot] = availableEnds
                if !availableEnds.isEmpty {
                    startSlots.append(startSlot)
                }
            }

            cachedAvailableEndSlotsByDate[dayKey] = endSlotsByStart
            cachedAvailableStartSlotsByDate[dayKey] = startSlots

            if startSlots.isEmpty {
                fullyBookedDates.insert(dayKey)
            }
        }
    }

    private func slotRange(start: String, end: String, on date: Date) -> ClosedRange<Date>? {
        guard let startDate = combine(date: date, timeString: start),
              let endDate = combine(date: date, timeString: end),
              endDate > startDate else {
            return nil
        }

        return startDate ... endDate
    }

    private func combine(date: Date, timeString: String) -> Date? {
        guard let minutes = timeString.asViennaTimeMinutes() else { return nil }

        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "Europe/Vienna") ?? .current

        return calendar.date(
            bySettingHour: minutes / 60,
            minute: minutes % 60,
            second: 0,
            of: date.startOfViennaDay()
        )
    }

    private func availableEndSlots(for startSlot: String, on date: Date, bookedRanges: [MinuteRange]) -> [String] {
        guard let startMinutes = startSlot.asViennaTimeMinutes() else { return [] }

        return allQuarterHourSlots.filter { endSlot in
            guard let endMinutes = endSlot.asViennaTimeMinutes(),
                  endMinutes > startMinutes,
                  let range = slotRange(start: startSlot, end: endSlot, on: date) else {
                return false
            }

            guard range.lowerBound > Date() else {
                return false
            }

            return bookedRanges.contains {
                $0.overlaps(start: startMinutes, end: endMinutes)
            } == false
        }
    }
}

private extension Booking {
    var durationInMinutes: Int {
        if let start = startDateValue, let end = endDateValue {
            return max(0, Int(end.timeIntervalSince(start) / 60))
        }

        let startParts = startTime.split(separator: ":").compactMap { Int($0) }
        let endParts = endTime.split(separator: ":").compactMap { Int($0) }
        guard startParts.count >= 2, endParts.count >= 2 else { return 0 }
        return max(0, (endParts[0] * 60 + endParts[1]) - (startParts[0] * 60 + startParts[1]))
    }
}
