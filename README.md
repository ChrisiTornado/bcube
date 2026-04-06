# BCUBE

BCUBE is a full-stack web application for managing and booking study and work studios at university locations. The project combines an Angular frontend with a Spring Boot microservice architecture and separate PostgreSQL databases for each domain service.

This repository is designed as a portfolio project and demonstrates authentication, role-based dashboards, CRUD workflows, booking processes, map and calendar views, service-to-service communication, and containerization with Docker.

## Features

- Registration, login, and password reset with verification code
- JWT-based authentication and role-based access for `USER` and `ADMIN`
- Admin dashboard for managing users and studios
- User dashboard for browsing, booking, and cancelling studio bookings
- Studio views with detail pages, pagination, and filter data
- Booking management with calendar view and booking details
- Map view with Mapbox integration
- Access service for creating and managing booking access codes
- Initial studio data setup with university locations and logos
- Docker Compose setup for frontend, services, and PostgreSQL databases

## Tech Stack

**Frontend**

- Angular 17
- TypeScript
- PrimeNG / PrimeFlex
- FullCalendar
- Mapbox GL
- Tailwind CSS / SCSS
- Nginx for production-like container serving

**Backend**

- Java 21
- Spring Boot 3
- Spring Security
- Spring Data JPA
- Spring Web / WebFlux
- Spring Cloud Gateway
- JWT
- PostgreSQL
- Maven
- Docker

## Architecture

```text
bcube
├── bcube-frontend
│   └── Angular SPA
├── bcube-services
│   ├── api-gateway
│   ├── user-service
│   ├── studio-service
│   ├── booking-service
│   └── access-service
└── docker-compose.yml
```

The application is split into domain-focused services:

- `user-service`: authentication, user management, roles, and password reset
- `studio-service`: studio/location data, admin CRUD, and initial university data
- `booking-service`: bookings, cancellations, calendar data, and cross-service queries
- `access-service`: access codes and access permissions for bookings
- `api-gateway`: API routing and central JWT protection
- `bcube-frontend`: Angular interface for user and admin workflows

## Quick Start

Prerequisites:

- Docker and Docker Compose
- Java 21 and Maven, if services are started locally
- Node.js, if the frontend is started locally
- Service-specific `.env` files for database and secret configuration

Clone and start the project:

```bash
git clone https://github.com/ChrisiTornado/bcube.git
cd bcube
docker compose up --build
```

After startup, the services are available on the ports defined in `docker-compose.yml`:

| Service | Port |
| --- | --- |
| Frontend | `http://localhost:4200` |
| User Service | `http://localhost:8081` |
| Studio Service | `http://localhost:8082` |
| Booking Service | `http://localhost:8083` |
| Access Service | `http://localhost:8084` |

## Local Development

Start the frontend:

```bash
cd bcube-frontend
npm install
npm start
```

Start a backend service locally:

```bash
cd bcube-services/user-service
./mvnw spring-boot:run
```

Run tests:

```bash
cd bcube-frontend
npm test
```

```bash
cd bcube-services/user-service
./mvnw test
```

## Project Highlights

- Microservice-oriented structure with clearly separated responsibilities
- Independent PostgreSQL persistence per service
- Role-based navigation and guards in the Angular frontend
- REST APIs with DTOs, validation, and global exception handling
- Service-to-service communication between Booking, User, Studio, and Access services
- Realistic admin and user workflows instead of static demo views
- Containerized setup for reproducible application startup

## License

This project is licensed under the Apache License 2.0. The full license is available in [LICENSE](./LICENSE).

An overview of third-party libraries and their licenses is available in [THIRD_PARTY_LICENSES.md](./THIRD_PARTY_LICENSES.md).

## Author

Christophe-Mokili Andunda

Copyright (c) 2026
