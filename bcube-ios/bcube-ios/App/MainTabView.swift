import SwiftUI

struct MainTabView: View {
    @EnvironmentObject private var sessionStore: SessionStore

    var body: some View {
        TabView {
            NavigationStack {
                StudiosListView()
            }
            .tabItem {
                Label("Cubes", systemImage: "square.grid.2x2.fill")
            }

            NavigationStack {
                StudiosMapView()
            }
            .tabItem {
                Label("Karte", systemImage: "map.fill")
            }

            NavigationStack {
                BookingsListView()
            }
            .tabItem {
                Label("Buchungen", systemImage: "checklist")
            }

            NavigationStack {
                CalendarOverviewView()
            }
            .tabItem {
                Label("Kalender", systemImage: "calendar")
            }

            NavigationStack {
                ProfileView()
            }
            .tabItem {
                Label("Einstellungen", systemImage: "gearshape.fill")
            }
        }
        .tint(BcubeTheme.Colors.accent)
        .environmentObject(sessionStore)
    }
}
