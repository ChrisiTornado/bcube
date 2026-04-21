import Foundation

enum NetworkError: LocalizedError {
    case invalidURL
    case invalidResponse
    case unauthorized
    case server(String)
    case decoding
    case transport(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Die URL konnte nicht erstellt werden."
        case .invalidResponse:
            return "Die Serverantwort war ungültig."
        case .unauthorized:
            return "Die Sitzung ist nicht mehr gültig."
        case .server(let message):
            return message
        case .decoding:
            return "Die Serverdaten konnten nicht verarbeitet werden."
        case .transport(let message):
            return message
        }
    }
}

struct APIEnvelope<T: Decodable>: Decodable {
    let message: String
    let data: T
}

struct APIMessageEnvelope: Decodable {
    let message: String
}

struct PageResponse<T: Decodable>: Decodable {
    let content: [T]
    let totalPages: Int
    let last: Bool?
}

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case delete = "DELETE"
}

struct EmptyBody: Encodable {}

final class NetworkService {
    static let shared = NetworkService()

    private let decoder: JSONDecoder
    private let encoder: JSONEncoder
    private let session: URLSession

    init(session: URLSession = .shared) {
        self.session = session
        self.decoder = JSONDecoder()
        self.encoder = JSONEncoder()
        decoder.keyDecodingStrategy = .useDefaultKeys
        encoder.keyEncodingStrategy = .useDefaultKeys
    }

    func request<T: Decodable>(
        path: String,
        method: HTTPMethod = .get,
        queryItems: [URLQueryItem] = [],
        requiresAuth: Bool = false,
        token: String? = nil,
        responseType: T.Type = T.self
    ) async throws -> T {
        try await request(
            path: path,
            method: method,
            queryItems: queryItems,
            body: Optional<EmptyBody>.none,
            requiresAuth: requiresAuth,
            token: token,
            responseType: responseType
        )
    }

    func request<T: Decodable, Body: Encodable>(
        path: String,
        method: HTTPMethod,
        queryItems: [URLQueryItem] = [],
        body: Body?,
        requiresAuth: Bool = false,
        token: String? = nil,
        responseType: T.Type = T.self
    ) async throws -> T {
        var lastError: Error?

        for baseURL in AppConfig.shared.candidateBaseURLs {
            do {
                return try await performRequest(
                    baseURL: baseURL,
                    path: path,
                    method: method,
                    queryItems: queryItems,
                    body: body,
                    requiresAuth: requiresAuth,
                    token: token,
                    responseType: responseType
                )
            } catch let error as NetworkError {
                lastError = error
                if !isRetryableTransportError(error) {
                    throw error
                }
            } catch {
                lastError = error
                if !isRetryableTransportError(error) {
                    throw NetworkError.transport(error.localizedDescription)
                }
            }
        }

        if let networkError = lastError as? NetworkError {
            throw networkError
        }

        throw NetworkError.transport(lastError?.localizedDescription ?? "Die Serververbindung konnte nicht hergestellt werden.")
    }

    private func performRequest<T: Decodable, Body: Encodable>(
        baseURL: URL,
        path: String,
        method: HTTPMethod,
        queryItems: [URLQueryItem],
        body: Body?,
        requiresAuth: Bool,
        token: String?,
        responseType: T.Type = T.self
    ) async throws -> T {
        var components = URLComponents(url: baseURL, resolvingAgainstBaseURL: false)
        components?.path = path
        components?.queryItems = queryItems.isEmpty ? nil : queryItems

        guard let url = components?.url else {
            throw NetworkError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 8

        if requiresAuth {
            guard let token else { throw NetworkError.unauthorized }
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body {
            request.httpBody = try encoder.encode(body)
        }

        do {
            let (data, response) = try await session.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw NetworkError.invalidResponse
            }

        let backendErrorMessage = parsedBackendErrorMessage(from: data)

        switch httpResponse.statusCode {
        case 200 ... 299:
                do {
                    return try decoder.decode(T.self, from: data)
                } catch {
                    throw NetworkError.decoding
                }
        case 401:
            if let backendErrorMessage {
                throw NetworkError.server(backendErrorMessage)
            }
            throw NetworkError.unauthorized
        default:
            if let backendErrorMessage {
                throw NetworkError.server(backendErrorMessage)
            }
            throw NetworkError.server(defaultMessage(for: httpResponse.statusCode))
        }
        } catch let error as NetworkError {
            throw error
        } catch let error as URLError {
            throw error
        } catch {
            throw NetworkError.transport(error.localizedDescription)
        }
    }

    private func isRetryableTransportError(_ error: Error) -> Bool {
        let nsError = error as NSError
        guard nsError.domain == NSURLErrorDomain else {
            return false
        }

        switch nsError.code {
        case URLError.timedOut.rawValue,
             URLError.cannotFindHost.rawValue,
             URLError.cannotConnectToHost.rawValue,
             URLError.networkConnectionLost.rawValue,
             URLError.notConnectedToInternet.rawValue,
             URLError.dnsLookupFailed.rawValue:
            return true
        default:
            return false
        }
    }

    private func parsedBackendErrorMessage(from data: Data) -> String? {
        guard let payload = try? decoder.decode(APIErrorEnvelope.self, from: data) else {
            return nil
        }

        let candidates = [
            payload.message,
            payload.data?.message
        ]

        return candidates
            .compactMap { $0?.trimmingCharacters(in: .whitespacesAndNewlines) }
            .first(where: { !$0.isEmpty })
    }

    private func defaultMessage(for statusCode: Int) -> String {
        switch statusCode {
        case 400:
            return "Die Anfrage konnte nicht verarbeitet werden."
        case 403:
            return "Du hast keine Berechtigung für diese Aktion."
        case 404:
            return "Die angeforderten Daten wurden nicht gefunden."
        case 409:
            return "Die Aktion konnte wegen eines Konflikts nicht ausgeführt werden."
        case 422:
            return "Die eingegebenen Daten sind ungültig."
        case 429:
            return "Zu viele Anfragen in kurzer Zeit. Bitte versuche es gleich erneut."
        case 500 ... 599:
            return "Der Server ist momentan nicht verfügbar."
        default:
            return "Die Anfrage konnte nicht abgeschlossen werden."
        }
    }
}

private struct APIErrorEnvelope: Decodable {
    let message: String?
    let data: APIErrorPayload?
}

private struct APIErrorPayload: Decodable {
    let message: String?

    init(from decoder: Decoder) throws {
        if let singleValue = try? decoder.singleValueContainer(),
           let stringValue = try? singleValue.decode(String.self) {
            message = stringValue
            return
        }

        let container = try decoder.container(keyedBy: CodingKeys.self)
        message = try container.decodeIfPresent(String.self, forKey: .message)
    }

    private enum CodingKeys: String, CodingKey {
        case message
    }
}
