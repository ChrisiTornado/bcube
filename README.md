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

- Java 25
- Spring Boot 4
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
├── bcube-web
│   └── Angular SPA
├── bcube-services
│   ├── api-gateway
│   ├── user-service
│   ├── studio-service
│   ├── booking-service
│   ├── access-service
│   ├── payment-service
│   └── docker-compose.yml     (databases only, for local development)
└── docker-compose.yml         (full stack, includes the databases above)
```

Each service has its own README (`bcube-services/<service>/README.md`) with port, database,
configuration, authentication and how to run its tests.

The application is split into domain-focused services:

- `user-service`: authentication, user management, roles, and password reset
- `studio-service`: studio/location data, admin CRUD, and initial university data
- `booking-service`: bookings, cancellations, calendar data, and cross-service queries
- `access-service`: access codes and access permissions for bookings
- `api-gateway`: API routing and central JWT protection
- `bcube-frontend`: Angular interface for user and admin workflows

## Environment Setup

Secrets are never committed. Every `.env` is git-ignored; a committed `.env.example` next to it lists the required variables. Run this once after cloning:

```bash
cp .env.example .env                                  # full stack (docker compose)
cp bcube-services/.env.example bcube-services/.env    # local development (IDE + databases only)
for s in user studio booking access payment; do
  cp bcube-services/$s-service/.env.example bcube-services/$s-service/.env
done
cp bcube-services/api-gateway/.env.example bcube-services/api-gateway/.env
cp bcube-web/src/environments/environment.example.ts bcube-web/src/environments/environment.ts
```

Then fill in the placeholders:

| File | Used by | Contains |
| --- | --- | --- |
| `.env` (root) | full stack: `docker compose` in the root folder | `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `INTERNAL_SERVICE_KEY` |
| `bcube-services/.env` | local development: databases compose file + services started from the IDE | the same four shared values (DB values default to `admin`/`admin`) |
| `bcube-services/<service>/.env` | that service only | service-specific secrets (Stripe, Google, SMTP, ...) and URLs |
| `bcube-web/src/environments/environment.ts` | Angular frontend (`ng serve`, `ng build`, Docker image) | API paths, Stripe publishable key, Mapbox token |

Shared values are defined once per mode and passed to the containers by `docker-compose.yml`, so they are not repeated in the service `.env` files. `JWT_SECRET` and `INTERNAL_SERVICE_KEY` must be the same in the root `.env` and `bcube-services/.env` if you switch between both modes against the same data.

Generate secrets with `openssl rand -base64 48` (for `ACCESS_AES_KEY` use `openssl rand -base64 32`).

## Local Development

Run only the databases and start the Spring services from your IDE, so code changes do not need an image rebuild:

```bash
cd bcube-services
docker compose up -d      # user-db :5433, studio-db :5434, booking-db :5435, access-db :5436, payment-db :5437
```

Each service loads `bcube-services/.env` automatically (`spring.config.import`) plus its own `bcube-services/<service>/.env`, so no IDE configuration is needed. The root `docker-compose.yml` includes this same file, so the databases are defined in one place.

> The database containers have fixed names (`user-db`, ...), so the development databases and the full stack
> cannot run at the same time. Stop one (`docker compose down`) before starting the other.

## Quick Start (full stack)

Prerequisites:

- Docker and Docker Compose
- Java 25 (`sdk env` reads `.sdkmanrc`), if services are started locally; each service ships `./mvnw`, so Maven is not needed
- Node.js 22 (`nvm use` reads `.nvmrc`), if the frontend is started locally
- `.env` files as described in Environment Setup

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
