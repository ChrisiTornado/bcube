import Foundation

struct StudioService {
    private let network = NetworkService.shared

    func getStudios(page: Int = 0, size: Int = 10, token: String) async throws -> PageResponse<Studio> {
        let envelope: APIEnvelope<PageResponse<Studio>> = try await network.request(
            path: "/api/studios/page",
            method: .get,
            queryItems: [
                URLQueryItem(name: "page", value: String(page)),
                URLQueryItem(name: "size", value: String(size))
            ],
            requiresAuth: true,
            token: token
        )
        return envelope.data
    }

    func getAllStudios(token: String) async throws -> [Studio] {
        let envelope: APIEnvelope<[Studio]> = try await network.request(path: "/api/studios", requiresAuth: true, token: token)
        return envelope.data
    }

    func getStudio(by id: Int, token: String) async throws -> Studio {
        let envelope: APIEnvelope<Studio> = try await network.request(path: "/api/studios/\(id)", requiresAuth: true, token: token)
        return envelope.data
    }

    func getStudioFilters(page: Int = 0, size: Int = 30, token: String) async throws -> [StudioFilter] {
        let envelope: APIEnvelope<PageResponse<StudioFilter>> = try await network.request(
            path: "/api/studios/filters",
            method: .get,
            queryItems: [
                URLQueryItem(name: "page", value: String(page)),
                URLQueryItem(name: "size", value: String(size))
            ],
            requiresAuth: true,
            token: token
        )
        return envelope.data.content
    }

    func getAllStudioFilters(pageSize: Int = 30, token: String) async throws -> [StudioFilter] {
        var page = 0
        var allFilters: [StudioFilter] = []
        var reachedLastPage = false

        while !reachedLastPage {
            let envelope: APIEnvelope<PageResponse<StudioFilter>> = try await network.request(
                path: "/api/studios/filters",
                method: .get,
                queryItems: [
                    URLQueryItem(name: "page", value: String(page)),
                    URLQueryItem(name: "size", value: String(pageSize))
                ],
                requiresAuth: true,
                token: token
            )

            allFilters += envelope.data.content
            reachedLastPage = envelope.data.last ?? (page >= max(0, envelope.data.totalPages - 1))
            page += 1
        }

        return allFilters
    }
}
