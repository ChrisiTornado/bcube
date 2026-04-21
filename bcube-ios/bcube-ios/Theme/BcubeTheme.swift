import SwiftUI

enum BcubeTheme {
    enum Colors {
        static let accent = Color(hex: "FFA722")
        static let accentSoft = Color(hex: "FFB53F")
        static let backgroundTop = Color(hex: "111111")
        static let backgroundBottom = Color(hex: "050505")
        static let panel = Color.white.opacity(0.07)
        static let panelStrong = Color.black.opacity(0.82)
        static let panelStroke = Color(hex: "FFA722").opacity(0.22)
        static let textPrimary = Color.white
        static let textSecondary = Color.white.opacity(0.72)
        static let danger = Color(red: 0.9, green: 0.3, blue: 0.3)
    }

    enum Spacing {
        static let xs: CGFloat = 8
        static let sm: CGFloat = 12
        static let md: CGFloat = 16
        static let lg: CGFloat = 24
        static let xl: CGFloat = 32
    }

    enum Radius {
        static let md: CGFloat = 18
        static let lg: CGFloat = 24
        static let xl: CGFloat = 30
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.replacingOccurrences(of: "#", with: "")
        let scanner = Scanner(string: hex)
        var value: UInt64 = 0
        scanner.scanHexInt64(&value)

        let red = Double((value >> 16) & 0xFF) / 255
        let green = Double((value >> 8) & 0xFF) / 255
        let blue = Double(value & 0xFF) / 255
        self.init(red: red, green: green, blue: blue)
    }
}
