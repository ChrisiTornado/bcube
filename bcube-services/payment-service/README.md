# payment-service

Stripe payments, webhooks, vouchers, invoices (PDF) and payment history.

| | |
| --- | --- |
| Port | `8085` |
| Database | PostgreSQL `bcube_payment_service` (local dev: `localhost:5437`, started by `bcube-services/docker-compose.yml`) |
| Calls | booking-service (payment-status callback), user-service (user lookups, notifications), Stripe. |
| Called by | api-gateway (`/api/payments`, `/api/admin/payments`); Stripe calls `POST /api/payments/webhook`. |

## Authentication

JWT validated locally; `/api/admin/payments/vouchers/**` needs `ROLE_ADMIN`. The webhook is public but verifies Stripe's signature; callbacks to booking-service use `X-Internal-Key`.

## Configuration

Shared values (`JWT_SECRET`, `INTERNAL_SERVICE_KEY`, DB credentials) come from `bcube-services/.env`
(local) or the root `.env` (Docker) - see the root README. Service-specific values go into
`bcube-services/payment-service/.env` (template: `.env.example`):

`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `FRONTEND_URL`, `USER_SERVICE_BASE_URL`, `BOOKING_SERVICE_BASE_URL`, `NOTIFICATION_SERVICE_BASE_URL`

Spring profile `docker` (used in containers) switches to the datasource and service URLs passed in
by `docker-compose.yml` and turns on JSON logging; OpenAPI is off there unless `OPENAPI_ENABLED=true`.

## Run

```bash
cd bcube-services && docker compose up -d      # databases
cd payment-service && ./mvnw spring-boot:run              # or start it from the IDE
```

OpenAPI: `http://localhost:8085/v3/api-docs`, Swagger UI at `/swagger-ui.html`.
Health: `/actuator/health`. Every response carries an `X-Request-Id` that also appears in the logs.

## Test

```bash
./mvnw test
```

Tests start a throwaway Postgres 17 with Testcontainers (Docker must be running) and use the
dummy secrets from `src/test/resources/application-test.properties`; no local database or `.env` is needed.

## Notes

Test or live mode is decided purely by which Stripe keys are configured.

