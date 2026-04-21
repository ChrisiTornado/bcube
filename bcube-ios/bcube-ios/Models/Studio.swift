import Foundation
import CoreLocation

struct Studio: Codable, Identifiable, Hashable {
    let id: Int
    let name: String
    let description: String
    let street: String
    let plz: Int
    let isActive: Bool?
    let city: String
    let country: String
    let latitude: Double?
    let longitude: Double?
    let image: [Int]?
    let imageBase64: String

    var fullAddress: String {
        "\(street), \(plz) \(city)"
    }

    var coordinate: CLLocationCoordinate2D? {
        guard let latitude, let longitude else { return nil }
        return CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
}

struct StudioFilter: Codable, Identifiable, Hashable {
    let id: Int
    let name: String
}
