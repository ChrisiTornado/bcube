# booking-service

Bookings, cancellations, calendar/slot data, reminders and abuse protection per IP.

| | |
| --- | --- |
| Port | `8083` |
| Database | PostgreSQL `bcube_booking_service` (local dev: `localhost:5435`, started by `bcube-services/docker-compose.yml`) |
| Calls | studio-service (`/summary`), user-service (notifications), payment-service (charges, refunds), access-service (door codes). |
| Called by | api-gateway (`/api/bookings`); payment-service calls `PATCH /api/bookings/{id}/payment-status` with the internal key. |

## Authentication

JWT validated locally; ownership is checked with the `userId` claim. `GET .../slots` is public, `GET /api/bookings` and studio cleanup need `ROLE_ADMIN`, the payment-status callback uses `X-Internal-Key`.

## Configuration

Shared values (`JWT_SECRET`, `INTERNAL_SERVICE_KEY`, DB credentials) come from `bcube-services/.env`
(local) or the root `.env` (Docker) - see the root README. Service-specific values go into
`bcube-services/booking-service/.env` (template: `.env.example`):

`FRONTEND_URL`, `USER_SERVICE_BASE_URL`, `STUDIO_SERVICE_BASE_URL`, `ACCESS_SERVICE_BASE_URL`, `PAYMENT_SERVICE_BASE_URL`, `NOTIFICATION_SERVICE_BASE_URL`

Spring profile `docker` (used in containers) switches to the datasource and service URLs passed in
by `docker-compose.yml` and turns on JSON logging; OpenAPI is off there unless `OPENAPI_ENABLED=true`.

## Run

```bash
cd bcube-services && docker compose up -d      # databases
cd booking-service && ./mvnw spring-boot:run              # or start it from the IDE
```

OpenAPI: `http://localhost:8083/v3/api-docs`, Swagger UI at `/swagger-ui.html`.
Health: `/actuator/health`. Every response carries an `X-Request-Id` that also appears in the logs.

## Test

```bash
./mvnw test
```

Tests start a throwaway Postgres 17 with Testcontainers (Docker must be running) and use the
dummy secrets from `src/test/resources/application-test.properties`; no local database or `.env` is needed.

## Notes

Studio data is fetched through the `/summary` endpoint on purpose: the full studio response carries the image gallery.

