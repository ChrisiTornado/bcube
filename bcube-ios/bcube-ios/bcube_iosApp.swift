import SwiftUI

@main
struct bcube_iosApp: App {
    @StateObject private var sessionStore = SessionStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(sessionStore)
                .task {
                    await sessionStore.restoreSession()
                }
        }
    }
}
