import SwiftUI

struct StudioDetailView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    @StateObject private var viewModel: StudioDetailViewModel
    @State private var activeTimeField: TimeSelectionField?
    @State private var didInitialLoad = false

    init(studio: Studio) {
        _viewModel = StateObject(wrappedValue: StudioDetailViewModel(studio: studio))
    }

    var body: some View {
        Group {
            if viewModel.isLoading && viewModel.bookings.isEmpty {
                BcubeLoadingScreen(message: "Cube-Details werden geladen")
            } else {
                ScrollView(.vertical, showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 18) {
                        hero
                        overviewCard
                        bookingCalendarCard
                        bookingActionCard
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(20)
                }
                .scrollBounceBehavior(.basedOnSize, axes: .vertical)
            }
        }
        .bcubeBackground()
        .detailScreenChrome(title: viewModel.studio.name)
        .task {
            if !didInitialLoad, let token = sessionStore.currentToken {
                didInitialLoad = true
                await viewModel.load(token: token)
            }
        }
        .onAppear {
            guard didInitialLoad,
                  viewModel.shouldRefreshAfterBookingFlow,
                  let token = sessionStore.currentToken else { return }
            Task {
                await viewModel.load(token: token)
                viewModel.clearBookingFlowState()
            }
        }
        .sheet(item: $activeTimeField) { field in
            TimeSelectionSheet(
                title: field.title,
                options: field == .start ? viewModel.availableStartSlots : viewModel.availableEndSlots,
                selection: Binding(
                    get: { field == .start ? viewModel.selectedStartSlot : viewModel.selectedEndSlot },
                    set: { newValue in
                        if field == .start {
                            viewModel.updateSelectedStartSlot(newValue)
                        } else {
                            viewModel.updateSelectedEndSlot(newValue)
                        }
                    }
                )
            )
        }
        .navigationDestination(item: $viewModel.createdBooking) { booking in
            BookingDetailView(bookingID: booking.id)
        }
    }

    private var hero: some View {
        BcubeCard {
            VStack(alignment: .leading, spacing: 14) {
                Base64StudioImageView(
                    base64: viewModel.studio.imageBase64,
                    fallbackIcon: "brand.logo",
                    contentMode: .fit,
                    imagePadding: 16,
                    panelCornerRadius: 24,
                    panelFill: Color.white.opacity(0.035)
                )
                    .frame(maxWidth: .infinity)
                    .frame(height: 164)
                    .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))

                Text(viewModel.studio.name)
                    .font(.system(size: 30, weight: .black, design: .rounded))

                Text(viewModel.studio.description)
                    .foregroundStyle(BcubeTheme.Colors.textSecondary)
                    .lineSpacing(4)
            }
        }
    }

    private var overviewCard: some View {
        BcubeCard {
            VStack(alignment: .leading, spacing: 12) {
                Label("Cubeübersicht", systemImage: "building.2.fill")
                    .font(.headline.weight(.bold))

                Text(viewModel.studio.fullAddress)
                    .foregroundStyle(BcubeTheme.Colors.textSecondary)

                Text(viewModel.studio.country)
                    .foregroundStyle(BcubeTheme.Colors.textSecondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var bookingCalendarCard: some View {
        BcubeCard {
            VStack(alignment: .leading, spacing: 16) {
                Text("Belegung & Datum")
                    .font(.headline.weight(.bold))

                BookingMonthCalendarView(
                    month: viewModel.selectedDate,
                    selectedDate: Binding(
                        get: { viewModel.selectedDate },
                        set: { viewModel.updateSelectedDate($0) }
                    ),
                    markedDates: viewModel.markedDates,
                    blockedDates: viewModel.fullyBookedDates,
                    disablePastDates: true
                )

                if !viewModel.dayBookings.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Belegte Slots am ausgewählten Tag")
                            .font(.subheadline.weight(.bold))

                        ForEach(viewModel.dayBookings) { booking in
                            Text(booking.timeLabel)
                            .font(.footnote)
                            .foregroundStyle(BcubeTheme.Colors.textSecondary)
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var bookingActionCard: some View {
        BcubeCard {
            VStack(alignment: .leading, spacing: 16) {
                Text("Buchen")
                    .font(.headline.weight(.bold))

                VStack(alignment: .leading, spacing: 10) {
                    Text("Gewähltes Datum: \(viewModel.selectedDate.bcubeLongWeekdayDate())")
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(BcubeTheme.Colors.textSecondary)

                    slotSelector(
                        title: "Startzeit",
                        selection: viewModel.selectedStartSlot,
                        options: viewModel.availableStartSlots,
                        onTap: { activeTimeField = .start }
                    )

                    slotSelector(
                        title: "Endzeit",
                        selection: viewModel.selectedEndSlot,
                        options: viewModel.availableEndSlots,
                        onTap: { activeTimeField = .end }
                    )
                }

                if let validationMessage = viewModel.validationMessage {
                    Text(validationMessage)
                        .foregroundStyle(BcubeTheme.Colors.accent)
                        .font(.footnote.weight(.semibold))
                }

                Button {
                    guard let user = sessionStore.currentUser,
                          let token = sessionStore.currentToken else { return }
                    Task {
                        await viewModel.createBooking(user: user, token: token)
                    }
                } label: {
                    if viewModel.isLoading {
                        ProgressView().tint(.black)
                    } else {
                        Text("Cube buchen")
                    }
                }
                .buttonStyle(BcubePrimaryButtonStyle())
            }
        }
    }

    private func slotSelector(title: String, selection: String, options: [String], onTap: @escaping () -> Void) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.footnote.weight(.bold))
                .foregroundStyle(BcubeTheme.Colors.textSecondary)

            Button(action: onTap) {
                HStack {
                    Text(selection)
                        .foregroundStyle(options.isEmpty ? BcubeTheme.Colors.textSecondary : BcubeTheme.Colors.textPrimary)
                    Spacer()
                    Image(systemName: "chevron.down")
                        .foregroundStyle(BcubeTheme.Colors.textSecondary)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 15)
                .background(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .fill(Color.white.opacity(0.07))
                        .overlay(
                            RoundedRectangle(cornerRadius: 18, style: .continuous)
                                .stroke(Color.white.opacity(0.08), lineWidth: 1)
                        )
                )
            }
            .buttonStyle(.plain)
            .disabled(options.isEmpty)
        }
    }
}

private enum TimeSelectionField: String, Identifiable {
    case start
    case end

    var id: String { rawValue }

    var title: String {
        switch self {
        case .start:
            return "Startzeit"
        case .end:
            return "Endzeit"
        }
    }
}

private struct TimeSelectionSheet: View {
    let title: String
    let options: [String]
    @Binding var selection: String
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Picker(title, selection: $selection) {
                    ForEach(options, id: \.self) { option in
                        Text(option).tag(option)
                    }
                }
                .pickerStyle(.wheel)
                .labelsHidden()
                .frame(maxWidth: .infinity)
            }
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Fertig") {
                        dismiss()
                    }
                }
            }
            .bcubeBackground()
        }
        .presentationDetents([.height(280)])
        .presentationDragIndicator(.visible)
    }
}

struct BookingMonthCalendarView: View {
    @State private var displayedMonth: Date
    @Binding var selectedDate: Date
    let markedDates: Set<String>
    let completedDates: Set<String>
    let blockedDates: Set<String>
    var disablePastDates = false
    var onMonthChange: ((Date, Int) -> Void)?

    private let calendar = Calendar.current
    private static let weekdaySymbols: [String] = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "de_AT")
        formatter.timeZone = TimeZone(identifier: "Europe/Vienna")
        return formatter.shortWeekdaySymbols
    }()

    init(
        month: Date,
        selectedDate: Binding<Date>,
        markedDates: Set<String>,
        completedDates: Set<String> = [],
        blockedDates: Set<String>,
        disablePastDates: Bool = false,
        onMonthChange: ((Date, Int) -> Void)? = nil
    ) {
        let calendar = Calendar.current
        _displayedMonth = State(initialValue: month.startOfMonth(using: calendar))
        _selectedDate = selectedDate
        self.markedDates = markedDates
        self.completedDates = completedDates
        self.blockedDates = blockedDates
        self.disablePastDates = disablePastDates
        self.onMonthChange = onMonthChange
    }

    var body: some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                monthNavigationButton(systemName: "chevron.left") {
                    changeMonth(by: -1)
                }

                Text(displayedMonth.bcubeMonthTitle())
                    .font(.title3.weight(.black))
                    .frame(maxWidth: .infinity, alignment: .leading)

                monthNavigationButton(systemName: "chevron.right") {
                    changeMonth(by: 1)
                }
            }

            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 7), spacing: 8) {
                ForEach(weekdayLabels, id: \.self) { label in
                    Text(label)
                        .font(.caption.weight(.bold))
                        .foregroundStyle(BcubeTheme.Colors.textSecondary)
                        .frame(maxWidth: .infinity)
                }

                ForEach(Array(days.enumerated()), id: \.offset) { _, date in
                    if let date {
                        Button {
                            selectedDate = date
                        } label: {
                            VStack(spacing: 6) {
                                Text("\(calendar.component(.day, from: date))")
                                    .font(.footnote.weight(.bold))

                                if showsIndicator(for: date) {
                                    Circle()
                                        .fill(indicatorColor(for: date))
                                        .frame(width: 6, height: 6)
                                } else {
                                    Color.clear
                                        .frame(width: 6, height: 6)
                                }
                            }
                            .frame(maxWidth: .infinity, minHeight: 46)
                            .background(background(for: date))
                            .opacity(isDisabled(date) ? 0.42 : 1)
                        }
                        .buttonStyle(.plain)
                        .disabled(isDisabled(date))
                    } else {
                        Color.clear.frame(height: 46)
                    }
                }
            }
        }
        .onChange(of: selectedDate) { _, newValue in
            let selectedMonth = newValue.startOfMonth(using: calendar)
            if !calendar.isDate(selectedMonth, equalTo: displayedMonth, toGranularity: .month) {
                displayedMonth = selectedMonth
            }
        }
    }

    private var weekdayLabels: [String] {
        Self.weekdaySymbols
    }

    private var days: [Date?] {
        let monthStart = displayedMonth.startOfMonth(using: calendar)
        let weekday = calendar.component(.weekday, from: monthStart)
        let leading = Array(repeating: Optional<Date>.none, count: max(0, weekday - calendar.firstWeekday))
        let range = calendar.range(of: .day, in: .month, for: monthStart) ?? 1..<31
        let monthDays = range.compactMap { day in
            calendar.date(bySetting: .day, value: day, of: monthStart)
        }.map { Optional($0) }
        return leading + monthDays
    }

    @ViewBuilder
    private func background(for date: Date) -> some View {
        RoundedRectangle(cornerRadius: 14, style: .continuous)
            .fill(date.isSameCalendarDay(as: selectedDate) ? BcubeTheme.Colors.accent.opacity(0.2) : Color.white.opacity(0.04))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(date.isSameCalendarDay(as: selectedDate) ? BcubeTheme.Colors.accent : Color.white.opacity(0.04), lineWidth: 1)
            )
    }

    private func indicatorColor(for date: Date) -> Color {
        let dayKey = date.viennaDayKey()

        if blockedDates.contains(dayKey) {
            return BcubeTheme.Colors.danger
        }

        if completedDates.contains(dayKey) {
            return Color(hex: "8A93A3")
        }

        return BcubeTheme.Colors.accent
    }

    private func showsIndicator(for date: Date) -> Bool {
        let dayKey = date.viennaDayKey()
        return markedDates.contains(dayKey) || completedDates.contains(dayKey) || blockedDates.contains(dayKey)
    }

    private func isDisabled(_ date: Date) -> Bool {
        disablePastDates && date.isBeforeTodayInVienna()
    }

    private func changeMonth(by value: Int) {
        guard let nextMonth = calendar.date(byAdding: .month, value: value, to: displayedMonth.startOfMonth(using: calendar)) else { return }
        withAnimation(.easeInOut(duration: 0.2)) {
            displayedMonth = nextMonth.startOfMonth(using: calendar)
        }
        onMonthChange?(displayedMonth, value)
    }

    private func monthNavigationButton(systemName: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.subheadline.weight(.bold))
                .foregroundStyle(BcubeTheme.Colors.textPrimary)
                .frame(width: 34, height: 34)
                .background(
                    Circle()
                        .fill(Color.white.opacity(0.06))
                        .overlay(
                            Circle()
                                .stroke(Color.white.opacity(0.08), lineWidth: 1)
                        )
                )
        }
        .buttonStyle(.plain)
    }
}
