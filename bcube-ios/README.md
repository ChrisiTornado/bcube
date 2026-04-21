# bcube iOS

Die iOS-App bildet die User-Seite aus `bcube-web` nativ mit SwiftUI nach.

## Struktur

- `bcube-ios/App`
  App-Einstieg und `TabView`-Navigation.
- `bcube-ios/Core`
  Session, Keychain, Netzwerk, Konfiguration und Datums-Helfer.
- `bcube-ios/Theme`
  Zentrales Theme plus wiederverwendbare UI-Bausteine.
- `bcube-ios/Models`
  User-, Studio-, Booking- und Auth-Modelle.
- `bcube-ios/Services`
  API-Services mit Demo-/Mock-Fallbacks.
- `bcube-ios/Features/Auth`
  Login, Registrierung und Passwort-Reset-Flow.
- `bcube-ios/Features/Studios`
  Studio-Liste, Detailansicht und Buchung.
- `bcube-ios/Features/Bookings`
  Buchungsliste und Booking-Detail.
- `bcube-ios/Features/Calendar`
  Monatsübersicht mit markierten Buchungstagen.
- `bcube-ios/Features/Map`
  MapKit-Karte mit Studio-Markern.
- `bcube-ios/Features/Profile`
  Profilverwaltung, Security-Einstieg und Logout.

## Hinweise

- Die Architektur ist auf Rollen vorbereitet (`USER`, später `ADMIN`), zeigt aktuell aber nur die User-App.
- Token werden über die Keychain gespeichert, der User zusätzlich lokal serialisiert.
- Wenn das Backend lokal nicht erreichbar ist, greifen die Services auf Demo-Daten zurück, damit die App trotzdem bedienbar bleibt.
- Die Base-URL wird zentral über `AppConfig` gesteuert.
- Im Simulator nutzt die App standardmäßig `http://localhost:8080`.
- Auf echten iPhones nutzt die App standardmäßig `http://MacBook-Pro-von-Christophe.local:8080`.
- In der App unter `Einstellungen -> Serververbindung` können Host und Port direkt überschrieben werden, z. B. auf eine LAN-IP wie `192.168.0.95`.
- Die iPhone-App und der Mac müssen dafür im selben Netzwerk sein und der lokale API-Gateway auf Port `8080` laufen.
