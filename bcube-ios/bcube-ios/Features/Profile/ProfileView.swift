import Combine
import SwiftUI

@MainActor
final class ProfileViewModel: ObservableObject {
    @Published var user: User?
    @Published var firstName = ""
    @Published var lastName = ""
    @Published var email = ""
    @Published var phone = ""
    @Published var isLoading = false
    @Published var infoMessage: String?
    @Published var errorMessage: String?

    private let service = UserService()

    func load(sessionStore: SessionStore) async {
        guard let userID = sessionStore.currentUser?.id,
              let token = sessionStore.currentToken else { return }
        isLoading = true
        defer { isLoading = false }
        errorMessage = nil

        do {
            let loadedUser = try await service.getUser(id: userID, token: token)
            apply(user: loadedUser)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func save(sessionStore: SessionStore) async {
        guard let session = sessionStore.session else { return }
        isLoading = true
        defer { isLoading = false }
        errorMessage = nil
        infoMessage = nil

        let payload = UpdateUserRequest(
            id: session.user.id,
            email: email,
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            isAdmin: false
        )

        do {
            let result = try await service.updateUser(payload: payload, token: session.token)
            apply(user: result.0)
            sessionStore.updateUser(result.0)
            infoMessage = result.1
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func apply(user: User) {
        self.user = user
        firstName = user.firstName ?? ""
        lastName = user.lastName ?? ""
        email = user.email
        phone = user.phone ?? ""
    }
}

struct ProfileView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    @StateObject private var viewModel = ProfileViewModel()

    var body: some View {
        Group {
            if viewModel.isLoading && viewModel.user == nil {
                BcubeLoadingScreen(message: "Einstellungen werden geladen")
            } else {
                ScrollView(.vertical, showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 18) {
                        settingsHeader

                        VStack(spacing: 12) {
                            NavigationLink {
                                EditPersonalDataView(viewModel: viewModel)
                                    .environmentObject(sessionStore)
                            } label: {
                                settingsRow(title: "Persönliche Daten", icon: "person.crop.circle.fill")
                            }
                            .buttonStyle(.plain)

                            NavigationLink {
                                PasswordSettingsView()
                                    .environmentObject(sessionStore)
                            } label: {
                                settingsRow(title: "Passwort ändern", icon: "lock.shield.fill")
                            }
                            .buttonStyle(.plain)

                            NavigationLink {
                                SettingsPlaceholderDetailView(
                                    title: "Zahlungsmittel",
                                    message: "Dieser Bereich ist vorbereitet und kann mit einer späteren Payment-Integration erweitert werden."
                                )
                            } label: {
                                settingsRow(title: "Zahlungsmittel", icon: "creditcard.fill")
                            }
                            .buttonStyle(.plain)

                            NavigationLink {
                                LegalDetailView(section: .impressum)
                            } label: {
                                settingsRow(title: "Impressum", icon: "doc.text.fill")
                            }
                            .buttonStyle(.plain)

                            NavigationLink {
                                LegalDetailView(section: .datenschutz)
                            } label: {
                                settingsRow(title: "Datenschutz", icon: "checkmark.shield.fill")
                            }
                            .buttonStyle(.plain)

                            NavigationLink {
                                LegalDetailView(section: .agb)
                            } label: {
                                settingsRow(title: "AGB", icon: "building.columns.fill")
                            }
                            .buttonStyle(.plain)

                            NavigationLink {
                                ConnectionSettingsView()
                            } label: {
                                settingsRow(title: "Serververbindung", icon: "network")
                            }
                            .buttonStyle(.plain)
                        }

                        Button("Logout") {
                            sessionStore.logout()
                        }
                        .buttonStyle(BcubePrimaryButtonStyle())
                        .padding(.top, 6)

                        NavigationLink {
                            SettingsPlaceholderDetailView(
                                title: "Account löschen",
                                message: "Die Löschfunktion bleibt bewusst vorbereitet, bis die API dafür produktiv freigegeben ist."
                            )
                        } label: {
                            settingsRow(title: "Account löschen", icon: "trash.fill", tint: BcubeTheme.Colors.danger, isDestructive: true)
                                .padding(.top, 4)
                        }
                        .buttonStyle(.plain)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(20)
                }
                .scrollBounceBehavior(.basedOnSize, axes: .vertical)
            }
        }
        .bcubeBackground()
        .rootTabChrome(title: "Einstellungen")
        .task {
            await viewModel.load(sessionStore: sessionStore)
        }
    }

    private var settingsHeader: some View {
        BcubeCard {
            HStack(alignment: .center, spacing: 16) {
                ZStack {
                    RoundedRectangle(cornerRadius: 26, style: .continuous)
                        .fill(BcubeTheme.Colors.accent.opacity(0.16))
                        .frame(width: 92, height: 92)
                    Text(viewModel.user?.initials ?? "BC")
                        .font(.system(size: 30, weight: .black, design: .rounded))
                        .foregroundStyle(BcubeTheme.Colors.textPrimary)
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text(viewModel.user?.displayName ?? "bcube Account")
                        .font(.system(size: 28, weight: .black, design: .rounded))
                        .foregroundStyle(BcubeTheme.Colors.textPrimary)
                    Text(viewModel.user?.email ?? "")
                        .foregroundStyle(BcubeTheme.Colors.textSecondary)
                        .font(.subheadline)

                    if let errorMessage = viewModel.errorMessage {
                        Text(errorMessage)
                            .font(.footnote.weight(.semibold))
                            .foregroundStyle(BcubeTheme.Colors.danger)
                    }
                }

                Spacer()
            }
        }
    }

    private func settingsRow(title: String, icon: String, tint: Color = BcubeTheme.Colors.accent, isDestructive: Bool = false) -> some View {
        BcubeCard {
            HStack(spacing: 14) {
                Image(systemName: icon)
                    .font(.title3.weight(.bold))
                    .foregroundStyle(tint)
                    .frame(width: 28)

                Text(title)
                    .font(.body.weight(.semibold))
                    .foregroundStyle(isDestructive ? BcubeTheme.Colors.danger : BcubeTheme.Colors.textPrimary)

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.footnote.weight(.bold))
                    .foregroundStyle(BcubeTheme.Colors.textSecondary)
            }
        }
    }
}

private struct ConnectionSettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var host = AppConfig.shared.host
    @State private var port = String(AppConfig.shared.effectivePort)
    @State private var infoMessage: String?
    @State private var errorMessage: String?

    var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            BcubeCard {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Serververbindung")
                        .font(.system(size: 28, weight: .black, design: .rounded))
                        .foregroundStyle(BcubeTheme.Colors.textPrimary)

                    Text(connectionHint)
                        .font(.footnote)
                        .foregroundStyle(BcubeTheme.Colors.textSecondary)
                        .fixedSize(horizontal: false, vertical: true)

                    VStack(alignment: .leading, spacing: 12) {
                        TextField("Host", text: $host)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .keyboardType(.URL)
                            .bcubeTextField()

                        TextField("Port", text: $port)
                            .keyboardType(.numberPad)
                            .bcubeTextField()
                    }

                    connectionValueRow(
                        title: "Aktive URL",
                        value: currentURLPreview
                    )

                    if let infoMessage {
                        Text(infoMessage)
                            .foregroundStyle(.green)
                            .font(.footnote.weight(.semibold))
                    }

                    if let errorMessage {
                        Text(errorMessage)
                            .foregroundStyle(BcubeTheme.Colors.danger)
                            .font(.footnote.weight(.semibold))
                    }

                    Button("Speichern") {
                        save()
                    }
                    .buttonStyle(BcubePrimaryButtonStyle())

                    Button("Standard wiederherstellen") {
                        restoreDefaults()
                    }
                    .buttonStyle(BcubeSecondaryButtonStyle())
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(20)
        }
        .scrollBounceBehavior(.basedOnSize, axes: .vertical)
        .bcubeBackground()
        .detailScreenChrome(title: "Serververbindung")
    }

    private var connectionHint: String {
#if targetEnvironment(simulator)
        return "Im Simulator wird standardmäßig localhost verwendet. Auf einem echten Gerät muss der Host auf deinen Mac im selben Netzwerk zeigen."
#else
        return "Auf einem echten Gerät muss der Host auf deinen Mac im selben Netzwerk zeigen. Standardmäßig ist der Bonjour-Hostname dieses Macs hinterlegt."
#endif
    }

    private var currentURLPreview: String {
        let normalizedHost = host.trimmingCharacters(in: .whitespacesAndNewlines)
        let normalizedPort = Int(port.trimmingCharacters(in: .whitespacesAndNewlines)) ?? AppConfig.Configuration.defaultPort
        let previewHost = normalizedHost.isEmpty ? AppConfig.Configuration.defaultHost : normalizedHost
        return "http://\(previewHost):\(normalizedPort)"
    }

    private func connectionValueRow(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.caption.weight(.semibold))
                .foregroundStyle(BcubeTheme.Colors.textSecondary)
            Text(value)
                .font(.footnote.monospaced())
                .foregroundStyle(BcubeTheme.Colors.textPrimary)
                .textSelection(.enabled)
        }
    }

    private func save() {
        let normalizedHost = host.trimmingCharacters(in: .whitespacesAndNewlines)
        let normalizedPort = port.trimmingCharacters(in: .whitespacesAndNewlines)

        guard !normalizedHost.isEmpty else {
            errorMessage = "Bitte gib einen Host ein."
            infoMessage = nil
            return
        }

        guard let portValue = Int(normalizedPort), (1...65535).contains(portValue) else {
            errorMessage = "Bitte gib einen gültigen Port ein."
            infoMessage = nil
            return
        }

        UserDefaults.standard.set(normalizedHost, forKey: AppConfig.hostDefaultsKey)
        UserDefaults.standard.set(portValue, forKey: AppConfig.portDefaultsKey)

        host = normalizedHost
        port = String(portValue)
        errorMessage = nil
        infoMessage = "Serververbindung gespeichert. Neue Requests nutzen jetzt \(AppConfig.shared.baseURLString)."
    }

    private func restoreDefaults() {
        UserDefaults.standard.removeObject(forKey: AppConfig.hostDefaultsKey)
        UserDefaults.standard.removeObject(forKey: AppConfig.portDefaultsKey)

        host = AppConfig.Configuration.defaultHost
        port = String(AppConfig.Configuration.defaultPort)
        errorMessage = nil
        infoMessage = "Standardwerte wurden wiederhergestellt."
    }
}

private struct SettingsPlaceholderDetailView: View {
    let title: String
    let message: String

    var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            BcubeCard {
                VStack(alignment: .leading, spacing: 14) {
                    Text(title)
                        .font(.system(size: 28, weight: .black, design: .rounded))
                        .foregroundStyle(BcubeTheme.Colors.textPrimary)

                    Text(message)
                        .font(.footnote)
                        .foregroundStyle(BcubeTheme.Colors.textSecondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(20)
        }
        .scrollBounceBehavior(.basedOnSize, axes: .vertical)
        .bcubeBackground()
        .detailScreenChrome(title: title)
    }
}

private struct PasswordSettingsView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        AuthCoordinatorView(
            mode: .passwordReset(onComplete: {
                dismiss()
            }),
            embeddedInNavigation: true
        )
            .environmentObject(sessionStore)
    }
}

private struct EditPersonalDataView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    @ObservedObject var viewModel: ProfileViewModel

    var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            BcubeCard {
                VStack(alignment: .leading, spacing: 14) {
                    TextField("Vorname", text: $viewModel.firstName)
                        .bcubeTextField()
                    TextField("Nachname", text: $viewModel.lastName)
                        .bcubeTextField()
                    TextField("E-Mail", text: $viewModel.email)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .bcubeTextField()
                    TextField("Telefonnummer", text: $viewModel.phone)
                        .keyboardType(.phonePad)
                        .bcubeTextField()

                    if let infoMessage = viewModel.infoMessage {
                        Text(infoMessage)
                            .foregroundStyle(.green)
                            .font(.footnote.weight(.semibold))
                    }

                    Button {
                        Task { await viewModel.save(sessionStore: sessionStore) }
                    } label: {
                        if viewModel.isLoading {
                            ProgressView().tint(.black)
                        } else {
                            Text("Speichern")
                        }
                    }
                    .buttonStyle(BcubePrimaryButtonStyle())
                }
            }
            .padding(20)
        }
        .scrollBounceBehavior(.basedOnSize, axes: .vertical)
        .bcubeBackground()
        .detailScreenChrome(title: "Persönliche Daten")
    }
}

struct LegalDetailView: View {
    let section: LegalSection

    var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            BcubeCard {
                VStack(alignment: .leading, spacing: 16) {
                    Text(section.header)
                        .font(.system(size: 24, weight: .black, design: .rounded))
                        .foregroundStyle(BcubeTheme.Colors.textPrimary)
                        .lineLimit(3)
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)

                    ForEach(section.blocks, id: \.title) { block in
                        VStack(alignment: .leading, spacing: 8) {
                            Text(block.title)
                                .font(.subheadline.weight(.bold))
                                .foregroundStyle(BcubeTheme.Colors.textPrimary)

                            if let body = block.body {
                                Text(body)
                                    .font(.footnote)
                                    .foregroundStyle(BcubeTheme.Colors.textSecondary)
                                    .fixedSize(horizontal: false, vertical: true)
                            }

                            if !block.bullets.isEmpty {
                                VStack(alignment: .leading, spacing: 6) {
                                    ForEach(block.bullets, id: \.self) { bullet in
                                        HStack(alignment: .top, spacing: 8) {
                                            Circle()
                                                .fill(BcubeTheme.Colors.accent)
                                                .frame(width: 6, height: 6)
                                                .padding(.top, 6)
                                            Text(bullet)
                                                .font(.footnote)
                                                .foregroundStyle(BcubeTheme.Colors.textSecondary)
                                                .fixedSize(horizontal: false, vertical: true)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            .padding(20)
        }
        .scrollBounceBehavior(.basedOnSize, axes: .vertical)
        .bcubeBackground()
        .detailScreenChrome(title: section.title)
    }
}

enum LegalSection: String, CaseIterable, Identifiable {
    case impressum
    case datenschutz
    case agb

    var id: String { rawValue }

    var title: String {
        switch self {
        case .impressum:
            return "Impressum"
        case .datenschutz:
            return "Datenschutz"
        case .agb:
            return "AGB"
        }
    }

    var header: String {
        switch self {
        case .impressum:
            return "Impressum"
        case .datenschutz:
            return "Datenschutzerklärung"
        case .agb:
            return "Allgemeine Geschäftsbedingungen"
        }
    }

    var blocks: [LegalBlock] {
        switch self {
        case .impressum:
            return [
                LegalBlock(title: "Einleitung", body: "Muster für eine Unternehmenswebsite in Österreich. Bitte ersetze die Platzhalter durch eure echten Unternehmensdaten."),
                LegalBlock(title: "Medieninhaber und Herausgeber", body: "BCube GmbH\nMusterstraße 1\n1010 Wien\nÖsterreich"),
                LegalBlock(title: "Kontakt", body: "E-Mail: office@bcube.at\nTelefon: +43 1 0000000"),
                LegalBlock(title: "Unternehmensangaben", body: "Firmenbuchnummer: FN 123456a\nFirmenbuchgericht: Handelsgericht Wien\nUID-Nummer: ATU12345678\nGewerbeaufsicht: Magistratisches Bezirksamt für den 1. Bezirk"),
                LegalBlock(title: "Unternehmensgegenstand", body: "Vermietung und Organisation von buchbaren Cube- und Studioflächen für kreative, technische und produktive Anwendungen."),
                LegalBlock(title: "Berufsrecht / Gewerberecht", body: "Es gelten die einschlägigen gewerberechtlichen Bestimmungen in Österreich. Weitere Informationen können über das Unternehmensserviceportal oder die WKO bezogen werden."),
                LegalBlock(title: "Haftung für Inhalte", body: "Alle Inhalte dieser Website wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte wird jedoch keine Haftung übernommen."),
                LegalBlock(title: "Haftung für Links", body: "Diese Website kann Links zu externen Websites enthalten. Für deren Inhalte sind ausschließlich die jeweiligen Betreiber verantwortlich.")
            ]
        case .datenschutz:
            return [
                LegalBlock(title: "Einleitung", body: "Diese Vorlage deckt die typischen Datenverarbeitungen für ein Buchungsportal ab. Bitte prüfe sie später noch mit euren konkreten Prozessen."),
                LegalBlock(title: "Verantwortlicher", body: "BCube GmbH, Musterstraße 1, 1010 Wien, Österreich\nE-Mail: datenschutz@bcube.at"),
                LegalBlock(title: "Welche Daten wir verarbeiten", bullets: [
                    "Stammdaten wie Name, E-Mail-Adresse und Telefonnummer",
                    "Buchungsdaten wie gebuchter Cube, Datum, Uhrzeit und Status",
                    "Zahlungsbezogene Daten, soweit diese für die Abwicklung erforderlich sind",
                    "Technische Daten wie IP-Adresse, Browserinformationen und Server-Logs"
                ]),
                LegalBlock(title: "Zwecke der Verarbeitung", bullets: [
                    "Bereitstellung der Website und des Nutzerkontos",
                    "Abwicklung und Verwaltung von Buchungen",
                    "Kommunikation zu Buchungen, Aenderungen und Supportanfragen",
                    "Erfüllung gesetzlicher Aufbewahrungs- und Nachweispflichten"
                ]),
                LegalBlock(title: "Rechtsgrundlagen", bullets: [
                    "Vertragserfüllung gemäß Art. 6 Abs. 1 lit. b DSGVO",
                    "Rechtliche Verpflichtung gemäß Art. 6 Abs. 1 lit. c DSGVO",
                    "Berechtigtes Interesse gemäß Art. 6 Abs. 1 lit. f DSGVO",
                    "Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO, sofern erforderlich"
                ]),
                LegalBlock(title: "Speicherdauer", body: "Personenbezogene Daten werden nur so lange gespeichert, wie dies für die jeweiligen Zwecke erforderlich ist oder gesetzliche Aufbewahrungsfristen dies vorsehen."),
                LegalBlock(title: "Empfänger", body: "Daten können an technische Dienstleister, Hosting-Provider, Zahlungsdienstleister oder andere Auftragsverarbeiter weitergegeben werden, soweit dies für den Betrieb der Plattform erforderlich ist."),
                LegalBlock(title: "Deine Rechte", body: "Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch im Rahmen der gesetzlichen Vorgaben."),
                LegalBlock(title: "Beschwerderecht", body: "Wenn du der Ansicht bist, dass die Verarbeitung deiner Daten gegen Datenschutzrecht verstößt, kannst du dich an die zuständige Datenschutzbehörde wenden.")
            ]
        case .agb:
            return [
                LegalBlock(title: "Einleitung", body: "Diese AGB sind als praxisnahes Grundgerüst für Buchungen gedacht. Bitte ersetze später insbesondere Fristen, Zahlungsregeln und Hausordnungsdetails."),
                LegalBlock(title: "1. Geltungsbereich", body: "Diese Allgemeinen Geschäftsbedingungen gelten für alle Buchungen von Cubes und damit verbundenen Leistungen über die BCube-Plattform."),
                LegalBlock(title: "2. Buchung", body: "Eine Buchung kommt zustande, sobald die Buchung über die Plattform bestätigt wurde. Der Anbieter behält sich vor, Buchungen aus sachlich gerechtfertigten Gründen abzulehnen."),
                LegalBlock(title: "3. Preise und Zahlung", body: "Es gelten die zum Buchungszeitpunkt auf der Plattform ausgewiesenen Preise. Zahlungen sind gemäß den im Buchungsprozess angezeigten Zahlungsbedingungen fällig."),
                LegalBlock(title: "4. Storno und Umbuchung", body: "Kostenfreie Stornierungen sind bis spätestens 48 Stunden vor Beginn der gebuchten Einheit möglich. Bei späterer Stornierung oder Nichterscheinen kann eine Stornogebühr verrechnet werden."),
                LegalBlock(title: "5. Nutzung der Cubes", body: "Die Cubes dürfen nur im vereinbarten Zeitraum und im Einklang mit der geltenden Hausordnung genutzt werden. Der Nutzer verpflichtet sich zu sorgfältigem Umgang mit den Räumlichkeiten und dem Inventar."),
                LegalBlock(title: "6. Haftung", body: "Der Anbieter haftet nur für Schäden, die vorsätzlich oder grob fahrlässig verursacht wurden, soweit gesetzlich zulässig. Für vom Nutzer eingebrachte Gegenstände wird keine Haftung übernommen."),
                LegalBlock(title: "7. Verhaltensregeln / Hausordnung", body: "Den Anweisungen vor Ort ist Folge zu leisten. Unzulässige Nutzung, Beschädigung, erhebliche Störung anderer Nutzer oder Verstoß gegen Sicherheitsvorgaben können zum sofortigen Ausschluss führen."),
                LegalBlock(title: "8. Schlussbestimmungen", body: "Es gilt österreichisches Recht unter Ausschluss der Kollisionsnormen. Zwingende Verbraucherschutzvorschriften bleiben unberührt.")
            ]
        }
    }
}

struct LegalBlock {
    let title: String
    var body: String? = nil
    var bullets: [String] = []
}
