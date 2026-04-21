import Combine
import SwiftUI
import MapKit

@MainActor
final class StudiosMapViewModel: ObservableObject {
    @Published var studios: [Studio] = []
    @Published var selectedStudio: Studio?
    @Published var selectedIndex = 0
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var position: MapCameraPosition = .region(
        MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 48.2082, longitude: 16.3738),
            span: MKCoordinateSpan(latitudeDelta: 0.18, longitudeDelta: 0.18)
        )
    )
    private var cameraTask: Task<Void, Never>?
    private let defaultCoordinate = CLLocationCoordinate2D(latitude: 48.2082, longitude: 16.3738)

    private let service = StudioService()

    func load(token: String) async {
        isLoading = true
        defer { isLoading = false }
        errorMessage = nil

        do {
            studios = try await service.getAllStudios(token: token)
            if !studios.isEmpty {
                await select(index: 0, animated: false)
            } else {
                selectedStudio = nil
            }
        } catch {
            studios = []
            selectedStudio = nil
            errorMessage = error.localizedDescription
        }
    }

    func select(index: Int) async {
        await select(index: index, animated: true)
    }

    func select(index: Int, animated: Bool) async {
        guard studios.indices.contains(index) else { return }
        let studio = studios[index]
        guard selectedStudio?.id != studio.id || selectedIndex != index else { return }
        let previousStudio = selectedStudio
        selectedIndex = index
        selectedStudio = studio
        if animated {
            await animateFocus(from: previousStudio?.coordinate, to: studio)
        } else {
            focus(on: studio)
        }
    }

    func focus(on studio: Studio) {
        selectedStudio = studio
        if let index = studios.firstIndex(where: { $0.id == studio.id }) {
            selectedIndex = index
        }

        if let coordinate = studio.coordinate {
            position = .region(
                MKCoordinateRegion(
                    center: coordinate,
                    span: MKCoordinateSpan(latitudeDelta: 0.03, longitudeDelta: 0.03)
                )
            )
        }
    }

    private func animateFocus(from previousCoordinate: CLLocationCoordinate2D?, to studio: Studio) async {
        cameraTask?.cancel()

        cameraTask = Task { @MainActor in
            guard let target = studio.coordinate else { return }

            let current = previousCoordinate ?? defaultCoordinate
            if current.latitude == target.latitude && current.longitude == target.longitude {
                focus(on: studio)
                return
            }
            let lifted = CLLocationCoordinate2D(
                latitude: current.latitude + 0.045,
                longitude: current.longitude
            )
            let bridge = CLLocationCoordinate2D(
                latitude: (lifted.latitude + target.latitude) / 2,
                longitude: (lifted.longitude + target.longitude) / 2
            )

            let deltaLat = max(abs(current.latitude - target.latitude) * 0.95, 0.055)
            let deltaLon = max(abs(current.longitude - target.longitude) * 0.95, 0.055)

            withAnimation(.easeInOut(duration: 1.8)) {
                position = .region(
                    MKCoordinateRegion(
                        center: bridge,
                        span: MKCoordinateSpan(latitudeDelta: deltaLat, longitudeDelta: deltaLon)
                    )
                )
            }

            try? await Task.sleep(nanoseconds: 900_000_000)

            withAnimation(.easeInOut(duration: 2.3)) {
                position = .region(
                    MKCoordinateRegion(
                        center: target,
                        span: MKCoordinateSpan(latitudeDelta: 0.03, longitudeDelta: 0.03)
                    )
                )
            }
        }

        await cameraTask?.value
    }
}

struct StudiosMapView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    @StateObject private var viewModel = StudiosMapViewModel()
    @Namespace private var sliderNamespace

    var body: some View {
        ZStack(alignment: .top) {
            Map(position: $viewModel.position) {
                ForEach(viewModel.studios) { studio in
                    if let coordinate = studio.coordinate {
                        Annotation(studio.name, coordinate: coordinate) {
                            Button {
                                Task {
                                    await viewModel.select(index: viewModel.studios.firstIndex(where: { $0.id == studio.id }) ?? 0)
                                }
                            } label: {
                                Circle()
                                    .fill(BcubeTheme.Colors.accent)
                                    .frame(width: 18, height: 18)
                                    .overlay(Circle().stroke(.black.opacity(0.35), lineWidth: 3))
                            }
                        }
                    }
                }
            }
            .ignoresSafeArea()

            VStack(spacing: 16) {
                Spacer()

                if viewModel.isLoading && viewModel.studios.isEmpty {
                    BcubeLoadingScreen(message: "Karte wird geladen")
                        .frame(height: 180)
                        .padding(.horizontal, 16)
                        .padding(.bottom, 28)
                } else if let errorMessage = viewModel.errorMessage, viewModel.studios.isEmpty {
                    EmptyStateCard(
                        title: "Karte konnte nicht geladen werden",
                        message: errorMessage,
                        actionTitle: nil,
                        action: nil
                    )
                    .padding(.horizontal, 16)
                    .padding(.bottom, 28)
                } else if !viewModel.studios.isEmpty {
                    TabView(selection: $viewModel.selectedIndex) {
                        ForEach(Array(viewModel.studios.enumerated()), id: \.element.id) { index, studio in
                            NavigationLink(value: studio) {
                                mapSliderCard(for: studio)
                                    .padding(.horizontal, 8)
                            }
                            .buttonStyle(.plain)
                            .tag(index)
                        }
                    }
                    .frame(height: 134)
                    .tabViewStyle(.page(indexDisplayMode: .never))
                    .onChange(of: viewModel.selectedIndex) { _, newIndex in
                        guard viewModel.studios.indices.contains(newIndex) else { return }
                        if viewModel.selectedStudio?.id != viewModel.studios[newIndex].id {
                            Task {
                                await viewModel.select(index: newIndex)
                            }
                        }
                    }
                    .padding(.horizontal, 8)
                    .padding(.bottom, 28)
                } 
            }
        }
        .rootTabChrome(title: "Karte")
        .navigationDestination(for: Studio.self) { studio in
            StudioDetailView(studio: studio)
        }
        .task {
            if let token = sessionStore.currentToken {
                await viewModel.load(token: token)
            }
        }
    }

    private func mapSliderCard(for studio: Studio) -> some View {
        HStack(alignment: .center, spacing: 12) {
            Base64StudioImageView(
                base64: studio.imageBase64,
                rawBytes: studio.image,
                fallbackIcon: "brand.logo",
                contentMode: .fit,
                imagePadding: 8,
                panelCornerRadius: 18,
                panelFill: Color.white.opacity(0.04)
            )
                .frame(width: 68, height: 68)
                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                .matchedGeometryEffect(id: "studio-image-\(studio.id)", in: sliderNamespace)

            VStack(alignment: .leading, spacing: 8) {
                Text(studio.name)
                    .font(.headline.weight(.bold))
                    .foregroundStyle(BcubeTheme.Colors.textPrimary)
                    .lineLimit(1)

                Text(studio.city)
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(BcubeTheme.Colors.accent)

                Text(studio.fullAddress)
                    .font(.footnote)
                    .foregroundStyle(BcubeTheme.Colors.textSecondary)
                    .lineLimit(2)
            }

            Spacer(minLength: 8)

            Image(systemName: "arrow.up.right")
                .font(.headline.weight(.bold))
                .foregroundStyle(BcubeTheme.Colors.accent)
        }
        .frame(maxWidth: .infinity, minHeight: 110, alignment: .leading)
        .padding(.horizontal, 15)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .fill(BcubeTheme.Colors.panelStrong.opacity(0.95))
                .overlay(
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .fill(
                            LinearGradient(
                                colors: [
                                    Color.white.opacity(0.05),
                                    Color.white.opacity(0.015)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .stroke(BcubeTheme.Colors.panelStroke, lineWidth: 1)
                )
        )
        .shadow(color: .black.opacity(0.28), radius: 24, x: 0, y: 12)
    }
}
