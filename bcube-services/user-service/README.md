# user-service

Registration, login (local and Google OAuth2), JWT issuing, password reset, user management and e-mail notifications.

| | |
| --- | --- |
| Port | `8081` |
| Database | PostgreSQL `bcube_user_service` (local dev: `localhost:5433`, started by `bcube-services/docker-compose.yml`) |
| Calls | payment-service (welcome voucher on registration), booking-service (open bookings before a user is deleted). |
| Called by | api-gateway (`/api/auth`, `/api/users`, `/api/admin/users`, `/oauth2`, `/login`); booking- and payment-service call `/api/notifications` with the internal key. |

## Authentication

Issues the HS256 JWTs every other service validates. `/api/auth/**` is public; `/api/admin/**` needs `ROLE_ADMIN`; `/api/notifications/**` is checked against `X-Internal-Key`. Login and the reset flow are rate limited per e-mail (429).

## Configuration

Shared values (`JWT_SECRET`, `INTERNAL_SERVICE_KEY`, DB credentials) come from `bcube-services/.env`
(local) or the root `.env` (Docker) - see the root README. Service-specific values go into
`bcube-services/user-service/.env` (template: `.env.example`):

`GOOGLE_CLIENT_SECRET`, `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD`, `ADMIN_BOOTSTRAP_EMAIL`/`ADMIN_BOOTSTRAP_PASSWORD` (optional), `OAUTH_REDIRECT_URI`, `FRONTEND_URL`, `PAYMENT_SERVICE_BASE_URL`, `BOOKING_SERVICE_BASE_URL`

Spring profile `docker` (used in containers) switches to the datasource and service URLs passed in
by `docker-compose.yml` and turns on JSON logging; OpenAPI is off there unless `OPENAPI_ENABLED=true`.

## Run

```bash
cd bcube-services && docker compose up -d      # databases
cd user-service && ./mvnw spring-boot:run              # or start it from the IDE
```

OpenAPI: `http://localhost:8081/v3/api-docs`, Swagger UI at `/swagger-ui.html`.
Health: `/actuator/health`. Every response carries an `X-Request-Id` that also appears in the logs.

## Test

```bash
./mvnw test
```

Tests start a throwaway Postgres 17 with Testcontainers (Docker must be running) and use the
dummy secrets from `src/test/resources/application-test.properties`; no local database or `.env` is needed.

## Notes

The password reset is three steps: `reset-password` (mails a code), `verify-code` (returns a single-use `resetToken`), `change-password` (needs e-mail + token).

