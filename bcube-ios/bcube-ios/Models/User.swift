import Foundation

enum UserRole: String, Codable, CaseIterable {
    case user = "USER"
    case admin = "ADMIN"
}

struct User: Codable, Identifiable, Hashable {
    let id: Int
    var email: String
    var role: UserRole
    var firstName: String?
    var lastName: String?
    var phone: String?

    var displayName: String {
        let name = [firstName, lastName]
            .compactMap { $0 }
            .filter { !$0.isEmpty }
            .joined(separator: " ")
        return name.isEmpty ? email : name
    }

    var initials: String {
        let parts = [firstName, lastName]
            .compactMap { $0 }
            .flatMap { $0.split(separator: " ") }

        if !parts.isEmpty {
            return parts.prefix(2).compactMap { $0.first }.map { String($0).uppercased() }.joined()
        }

        return String(email.prefix(2)).uppercased()
    }

    enum CodingKeys: String, CodingKey {
        case id
        case email
        case role
        case firstName
        case lastName
        case phone
        case isAdmin
    }

    init(id: Int, email: String, role: UserRole, firstName: String?, lastName: String?, phone: String?) {
        self.id = id
        self.email = email
        self.role = role
        self.firstName = firstName
        self.lastName = lastName
        self.phone = phone
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(Int.self, forKey: .id)
        email = try container.decode(String.self, forKey: .email)
        role = try container.decodeIfPresent(UserRole.self, forKey: .role)
            ?? ((try container.decodeIfPresent(Bool.self, forKey: .isAdmin)) == true ? .admin : .user)
        firstName = try container.decodeIfPresent(String.self, forKey: .firstName)
        lastName = try container.decodeIfPresent(String.self, forKey: .lastName)
        phone = try container.decodeIfPresent(String.self, forKey: .phone)
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(email, forKey: .email)
        try container.encode(role, forKey: .role)
        try container.encodeIfPresent(firstName, forKey: .firstName)
        try container.encodeIfPresent(lastName, forKey: .lastName)
        try container.encodeIfPresent(phone, forKey: .phone)
        try container.encode(role == .admin, forKey: .isAdmin)
    }
}

struct UserSession: Equatable {
    let token: String
    let user: User
}
