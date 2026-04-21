import Foundation

enum AppConfig {
    static var shared: Configuration {
        Configuration()
    }

    static let hostDefaultsKey = "bcube.api.host"
    static let portDefaultsKey = "bcube.api.port"

    struct Configuration {
        let scheme: String
        let host: String
        let port: Int

        init() {
            scheme = "http"
            let defaults = UserDefaults.standard
            let storedHost = defaults.string(forKey: AppConfig.hostDefaultsKey)?
                .trimmingCharacters(in: .whitespacesAndNewlines)
            let storedPort = defaults.integer(forKey: AppConfig.portDefaultsKey)

            host = (storedHost?.isEmpty == false ? storedHost : nil) ?? Self.defaultHost
            port = storedPort == 0 ? Self.defaultPort : storedPort
        }

        static var defaultHost: String {
#if targetEnvironment(simulator)
            return "localhost"
#else
            return "192.168.0.95"
#endif
        }

        static var fallbackHosts: [String] {
#if targetEnvironment(simulator)
            return ["localhost", "127.0.0.1"]
#else
            return [
                "192.168.0.95",
                "MacBook-Pro-von-Christophe.local",
                "macbook-pro-von-christophe.local"
            ]
#endif
        }

        static let defaultPort = 8080

        var effectivePort: Int {
            port == 0 ? Self.defaultPort : port
        }

        var baseURL: URL {
            var components = URLComponents()
            components.scheme = scheme
            components.host = host
            components.port = effectivePort
            components.path = ""
            return components.url ?? URL(string: "http://\(Self.defaultHost):\(Self.defaultPort)")!
        }

        var baseURLString: String {
            baseURL.absoluteString
        }

        var candidateBaseURLs: [URL] {
            let candidateHosts = [host] + Self.fallbackHosts
            let uniqueHosts = candidateHosts.reduce(into: [String]()) { partialResult, value in
                let normalized = value.trimmingCharacters(in: .whitespacesAndNewlines)
                guard !normalized.isEmpty else { return }
                if !partialResult.contains(normalized) {
                    partialResult.append(normalized)
                }
            }

            return uniqueHosts.compactMap { candidateHost in
                var components = URLComponents()
                components.scheme = scheme
                components.host = candidateHost
                components.port = effectivePort
                components.path = ""
                return components.url
            }
        }
    }
}
