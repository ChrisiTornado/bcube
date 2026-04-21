import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var sessionStore: SessionStore

    var body: some View {
        Group {
            if sessionStore.isRestoringSession {
                BcubeLoadingScreen(message: "Session wird vorbereitet")
            } else if sessionStore.isAuthenticated {
                MainTabView()
            } else {
                AuthCoordinatorView(mode: .authentication)
            }
        }
        .preferredColorScheme(.dark)
        .animation(.easeInOut(duration: 0.25), value: sessionStore.isAuthenticated)
    }
}
