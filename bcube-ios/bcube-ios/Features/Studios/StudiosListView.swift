import SwiftUI

struct StudiosListView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    @StateObject private var viewModel = StudiosListViewModel()
    private let topAnchorID = "studios-top-anchor"

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView(.vertical, showsIndicators: false) {
                VStack(alignment: .leading, spacing: 20) {
                    Color.clear
                        .frame(height: 1)
                        .id(topAnchorID)

                    if viewModel.isLoading && viewModel.studios.isEmpty {
                        BcubeLoadingScreen(message: "Cubes werden geladen")
                            .frame(height: 280)
                    } else if let errorMessage = viewModel.errorMessage, viewModel.studios.isEmpty {
                        EmptyStateCard(
                            title: "Cubes konnten nicht geladen werden",
                            message: errorMessage,
                            actionTitle: nil,
                            action: nil
                        )
                    } else {
                        LazyVStack(spacing: 10) {
                            ForEach(viewModel.studios) { studio in
                                NavigationLink(value: studio) {
                                    StudioCardView(studio: studio)
                                }
                                .buttonStyle(.plain)
                            }

                            if let token = sessionStore.currentToken {
                                PaginationFooter(
                                    currentPage: viewModel.currentPage,
                                    totalPages: viewModel.totalPages,
                                    canGoBackward: viewModel.currentPage > 0,
                                    canGoForward: viewModel.currentPage < viewModel.totalPages - 1,
                                    isLoading: viewModel.isLoading,
                                    onPrevious: {
                                        withAnimation(.easeInOut(duration: 0.22)) {
                                            proxy.scrollTo(topAnchorID, anchor: .top)
                                        }
                                        Task { await viewModel.goToPreviousPage(token: token) }
                                    },
                                    onNext: {
                                        withAnimation(.easeInOut(duration: 0.22)) {
                                            proxy.scrollTo(topAnchorID, anchor: .top)
                                        }
                                        Task { await viewModel.goToNextPage(token: token) }
                                    }
                                )
                            }
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(20)
            }
            .scrollBounceBehavior(.basedOnSize, axes: .vertical)
        }
        .bcubeBackground()
        .rootTabChrome(title: "Cubes")
        .navigationDestination(for: Studio.self) { studio in
            StudioDetailView(studio: studio)
        }
        .task {
            if viewModel.studios.isEmpty, let token = sessionStore.currentToken {
                await viewModel.loadInitial(token: token)
            }
        }
    }
}

private struct StudioCardView: View {
    let studio: Studio

    var body: some View {
        BcubeCard {
            VStack(alignment: .leading, spacing: 12) {
                Base64StudioImageView(
                    base64: studio.imageBase64,
                    fallbackIcon: "brand.logo",
                    contentMode: .fill,
                    imagePadding: 0,
                    panelCornerRadius: 18,
                    panelFill: Color.white.opacity(0.035)
                )
                .frame(maxWidth: .infinity)
                .frame(height: 92)
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))

                HStack(alignment: .top, spacing: 10) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(studio.name)
                            .font(.system(size: 18, weight: .bold, design: .rounded))
                            .foregroundStyle(BcubeTheme.Colors.textPrimary)
                            .lineLimit(2)
                            .frame(maxWidth: .infinity, alignment: .leading)

                        Text(studio.fullAddress)
                            .foregroundStyle(BcubeTheme.Colors.textSecondary)
                            .font(.footnote)
                            .lineLimit(2)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    Image(systemName: "arrow.up.right")
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(BcubeTheme.Colors.accent)
                        .frame(width: 20, height: 20)
                        .padding(.top, 4)
                }

                BcubeTag(title: studio.country, icon: "globe.europe.africa.fill")
            }
            .frame(maxWidth: .infinity, alignment: .topLeading)
        }
    }
}
