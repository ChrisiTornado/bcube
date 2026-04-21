import SwiftUI
import UIKit

struct BcubeBackground: ViewModifier {
    func body(content: Content) -> some View {
        ZStack {
            LinearGradient(
                colors: [BcubeTheme.Colors.backgroundTop, Color(hex: "1A1A1A"), BcubeTheme.Colors.backgroundBottom],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            Circle()
                .fill(BcubeTheme.Colors.accent.opacity(0.16))
                .blur(radius: 80)
                .frame(width: 220, height: 220)
                .offset(x: -110, y: -260)

            Circle()
                .fill(BcubeTheme.Colors.accent.opacity(0.12))
                .blur(radius: 90)
                .frame(width: 240, height: 240)
                .offset(x: 150, y: 320)

            content
        }
    }
}

struct BcubeCard<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        content
            .padding(BcubeTheme.Spacing.md)
            .background(
                RoundedRectangle(cornerRadius: BcubeTheme.Radius.lg, style: .continuous)
                    .fill(.ultraThinMaterial.opacity(0.35))
                    .overlay(
                        RoundedRectangle(cornerRadius: BcubeTheme.Radius.lg, style: .continuous)
                            .stroke(BcubeTheme.Colors.panelStroke, lineWidth: 1)
                    )
            )
            .shadow(color: .black.opacity(0.22), radius: 24, x: 0, y: 18)
    }
}

struct BrandBadgeView: View {
    var body: some View {
        HStack(spacing: 14) {
            BrandLogoMark(size: 62, cornerRadius: 18)

            Text("cube")
                .font(.system(size: 34, weight: .black, design: .rounded))
                .foregroundStyle(BcubeTheme.Colors.textPrimary)
                .textCase(.lowercase)
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 14)
        .background(
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .fill(BcubeTheme.Colors.panelStrong.opacity(0.78))
                .overlay(
                    RoundedRectangle(cornerRadius: 26, style: .continuous)
                        .stroke(BcubeTheme.Colors.panelStroke, lineWidth: 1)
                )
        )
    }
}

struct BrandLogoMark: View {
    let size: CGFloat
    let cornerRadius: CGFloat
    var showsShadow: Bool = true

    var body: some View {
        Image("BrandLogo")
            .renderingMode(.original)
            .resizable()
            .interpolation(.high)
            .antialiased(true)
            .scaledToFill()
            .frame(width: size, height: size)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(BcubeTheme.Colors.panelStroke, lineWidth: 1)
            )
            .shadow(color: showsShadow ? BcubeTheme.Colors.accent.opacity(0.2) : .clear, radius: 16, x: 0, y: 10)
    }
}

struct ToolbarBrandLogoMark: View {
    var body: some View {
        BrandLogoMark(size: 36, cornerRadius: 10, showsShadow: false)
            .fixedSize()
            .allowsHitTesting(false)
            .accessibilityHidden(true)
            .padding(.vertical, 2)
    }
}

struct RootTabHeader: View {
    let title: String

    var body: some View {
        ZStack {
            Text(title)
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundStyle(BcubeTheme.Colors.textPrimary)

            HStack {
                Spacer()
                ToolbarBrandLogoMark()
            }
        }
        .frame(height: 44)
        .padding(.horizontal, 16)
        .padding(.top, 4)
        .padding(.bottom, 8)
        .background(Color.clear)
    }
}

struct RootTabChrome: ViewModifier {
    let title: String

    func body(content: Content) -> some View {
        content
            .toolbar(.hidden, for: .navigationBar)
            .safeAreaInset(edge: .top, spacing: 0) {
                RootTabHeader(title: title)
            }
    }
}

struct DetailScreenHeader: View {
    @Environment(\.dismiss) private var dismiss

    let title: String

    var body: some View {
        ZStack {
            Text(title)
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundStyle(BcubeTheme.Colors.textPrimary)
                .lineLimit(1)
                .truncationMode(.tail)
                .padding(.horizontal, 64)

            HStack {
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(BcubeTheme.Colors.textPrimary)
                        .frame(width: 36, height: 36)
                        .background(
                            Circle()
                                .fill(BcubeTheme.Colors.panelStrong.opacity(0.72))
                                .overlay(
                                    Circle()
                                        .stroke(BcubeTheme.Colors.panelStroke, lineWidth: 1)
                                )
                        )
                }
                .buttonStyle(.plain)

                Spacer()

                ToolbarBrandLogoMark()
            }
        }
        .frame(height: 44)
        .padding(.horizontal, 16)
        .padding(.top, 4)
        .padding(.bottom, 8)
        .background(Color.clear)
    }
}

struct DetailScreenChrome: ViewModifier {
    let title: String

    func body(content: Content) -> some View {
        content
            .toolbar(.hidden, for: .navigationBar)
            .safeAreaInset(edge: .top, spacing: 0) {
                DetailScreenHeader(title: title)
            }
    }
}

struct AppSectionHeader: View {
    let title: String
    let accessory: AnyView?

    init(title: String, accessory: AnyView? = nil) {
        self.title = title
        self.accessory = accessory
    }

    var body: some View {
        HStack(alignment: .center, spacing: 16) {
            Text(title)
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundStyle(BcubeTheme.Colors.textPrimary)
            Spacer(minLength: 12)

            if let accessory {
                accessory
            }
        }
        .frame(height: 56)
    }
}

struct BcubeTag: View {
    let title: String
    let icon: String

    var body: some View {
        Label(title, systemImage: icon)
            .font(.caption.weight(.semibold))
            .foregroundStyle(BcubeTheme.Colors.textPrimary)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(
                Capsule()
                    .fill(Color.white.opacity(0.06))
                    .overlay(
                        Capsule()
                            .stroke(BcubeTheme.Colors.panelStroke, lineWidth: 1)
                    )
            )
    }
}

struct SectionEyebrow: View {
    let title: String

    var body: some View {
        Text(title.uppercased())
            .font(.caption.weight(.heavy))
            .tracking(1.1)
            .foregroundStyle(BcubeTheme.Colors.accent)
    }
}

struct BcubePrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 16, weight: .bold, design: .rounded))
            .foregroundStyle(.black.opacity(0.92))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [BcubeTheme.Colors.accent, BcubeTheme.Colors.accentSoft],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            )
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .shadow(color: BcubeTheme.Colors.accent.opacity(0.18), radius: 18, x: 0, y: 12)
    }
}

struct BcubeSecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 16, weight: .semibold, design: .rounded))
            .foregroundStyle(BcubeTheme.Colors.textPrimary)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(Color.white.opacity(0.05))
                    .overlay(
                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .stroke(BcubeTheme.Colors.panelStroke, lineWidth: 1)
                    )
            )
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
    }
}

struct BcubeTextFieldModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
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
            .foregroundStyle(BcubeTheme.Colors.textPrimary)
    }
}

struct BcubeLoadingScreen: View {
    let message: String

    var body: some View {
        VStack {
            Spacer(minLength: 0)

            BcubeCard {
                VStack(spacing: 16) {
                    ProgressView()
                        .progressViewStyle(.circular)
                        .tint(BcubeTheme.Colors.accent)
                        .scaleEffect(1.25)

                    Text(message)
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(BcubeTheme.Colors.textSecondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
            }
            .padding(.horizontal, 20)

            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(
            LinearGradient(
                colors: [
                    Color.black.opacity(0.14),
                    Color.black.opacity(0.08)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
        )
    }
}

struct EmptyStateCard: View {
    let title: String
    let message: String
    let actionTitle: String?
    let action: (() -> Void)?

    var body: some View {
        BcubeCard {
            VStack(alignment: .leading, spacing: 12) {
                Text(title)
                    .font(.system(.title3, design: .rounded, weight: .bold))
                    .foregroundStyle(BcubeTheme.Colors.textPrimary)

                Text(message)
                    .foregroundStyle(BcubeTheme.Colors.textSecondary)

                if let actionTitle, let action {
                    Button(actionTitle, action: action)
                        .buttonStyle(BcubePrimaryButtonStyle())
                        .padding(.top, 6)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

struct InlineStatusBadge: View {
    let status: BookingStatus

    var body: some View {
        Text(status.label)
            .font(.caption.weight(.bold))
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(statusColor.opacity(0.18))
            .foregroundStyle(statusColor)
            .clipShape(Capsule())
    }

    private var statusColor: Color {
        switch status {
        case .confirmed:
            return BcubeTheme.Colors.accent
        case .cancelled, .failed:
            return BcubeTheme.Colors.danger
        case .done:
            return .green
        case .pending:
            return .yellow
        }
    }
}

struct PaginationFooter: View {
    let currentPage: Int
    let totalPages: Int
    let canGoBackward: Bool
    let canGoForward: Bool
    let isLoading: Bool
    let onPrevious: () -> Void
    let onNext: () -> Void

    var body: some View {
        if totalPages > 1 {
            BcubeCard {
                HStack(spacing: 14) {
                    Button(action: onPrevious) {
                        if isLoading {
                            ProgressView()
                                .tint(BcubeTheme.Colors.textPrimary)
                                .frame(maxWidth: .infinity)
                        } else {
                            Label("Zurück", systemImage: "chevron.left")
                        }
                    }
                    .buttonStyle(BcubeSecondaryButtonStyle())
                    .disabled(!canGoBackward || isLoading)

                    Spacer()

                    VStack(spacing: 4) {
                        Text("Seite \(currentPage + 1) von \(totalPages)")
                            .font(.footnote.weight(.bold))
                            .foregroundStyle(BcubeTheme.Colors.textSecondary)

                        if isLoading {
                            Text("Neue Seite wird geladen")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(BcubeTheme.Colors.accent)
                        }
                    }

                    Spacer()

                    Button(action: onNext) {
                        if isLoading {
                            ProgressView()
                                .tint(BcubeTheme.Colors.textPrimary)
                                .frame(maxWidth: .infinity)
                        } else {
                            Label("Weiter", systemImage: "chevron.right")
                        }
                    }
                    .buttonStyle(BcubeSecondaryButtonStyle())
                    .disabled(!canGoForward || isLoading)
                }
            }
        }
    }
}

struct Base64StudioImageView: View {
    let base64: String
    var rawBytes: [Int]? = nil
    let fallbackIcon: String
    var contentMode: ContentMode = .fit
    var imagePadding: CGFloat = 14
    var panelCornerRadius: CGFloat = 20
    var panelFill: Color = Color.white.opacity(0.03)

    private static let imageCache = NSCache<NSString, UIImage>()

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: panelCornerRadius, style: .continuous)
                .fill(panelFill)
                .overlay(
                    RoundedRectangle(cornerRadius: panelCornerRadius, style: .continuous)
                        .stroke(Color.white.opacity(0.05), lineWidth: 1)
                )

            if let uiImage = cachedImage {
                Image(uiImage: uiImage)
                    .resizable()
                    .aspectRatio(contentMode: contentMode)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .padding(imagePadding)
            } else {
                LinearGradient(
                    colors: [BcubeTheme.Colors.accent.opacity(0.9), Color(hex: "5A3900")],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .clipShape(RoundedRectangle(cornerRadius: panelCornerRadius, style: .continuous))
                .overlay(
                    Group {
                        if fallbackIcon == "brand.logo" {
                            BrandLogoMark(size: 68, cornerRadius: 20)
                        } else {
                            Image(systemName: fallbackIcon)
                                .font(.system(size: 36, weight: .bold))
                                .foregroundStyle(.black.opacity(0.9))
                        }
                    }
                )
                .padding(1)
            }
        }
    }

    private var cachedImage: UIImage? {
        let cacheKey = NSString(string: cacheIdentifier)

        if let cached = Self.imageCache.object(forKey: cacheKey) {
            return cached
        }

        guard let data = imageData,
              let uiImage = UIImage(data: data) else {
            return nil
        }

        Self.imageCache.setObject(uiImage, forKey: cacheKey)
        return uiImage
    }

    private var imageData: Data? {
        if let base64Data = decodedBase64Data {
            return base64Data
        }

        guard let rawBytes, !rawBytes.isEmpty else {
            return nil
        }

        return Data(rawBytes.map { UInt8(clamping: $0) })
    }

    private var decodedBase64Data: Data? {
        guard !cleanedString.isEmpty else {
            return nil
        }

        return Data(base64Encoded: cleanedString)
    }

    private var cacheIdentifier: String {
        if !cleanedString.isEmpty {
            return "base64:\(cleanedString)"
        }

        if let rawBytes, !rawBytes.isEmpty {
            let byteSignature = rawBytes.prefix(32).map(String.init).joined(separator: ",")
            return "bytes:\(rawBytes.count):\(byteSignature)"
        }

        return "fallback:\(fallbackIcon)"
    }

    private var cleanedString: String {
        base64
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: "data:image/jpeg;base64,", with: "", options: [.caseInsensitive])
            .replacingOccurrences(of: "data:image/png;base64,", with: "", options: [.caseInsensitive])
            .replacingOccurrences(of: "\n", with: "")
            .replacingOccurrences(of: "\r", with: "")
    }
}

extension View {
    func bcubeBackground() -> some View {
        modifier(BcubeBackground())
    }

    func rootTabChrome(title: String) -> some View {
        modifier(RootTabChrome(title: title))
    }

    func detailScreenChrome(title: String) -> some View {
        modifier(DetailScreenChrome(title: title))
    }

    func bcubeTextField() -> some View {
        modifier(BcubeTextFieldModifier())
    }
}
