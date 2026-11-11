# access-service

Creates and revokes smart-lock access codes for bookings through the Nuki API.

| | |
| --- | --- |
| Port | `8084` |
| Database | PostgreSQL `bcube_access_service` (local dev: `localhost:5436`, started by `bcube-services/docker-compose.yml`) |
| Calls | Nuki Web API (`NUKI_API_TOKEN`). |
| Called by | booking-service only (server-to-server). Not routed by the gateway. |

## Authentication

Internal only: a filter accepts the `X-Internal-Key` header and grants `ROLE_INTERNAL`; everything except `/api/access/**` (with the key) and `/actuator/health` is denied by default.

## Configuration

Shared values (`JWT_SECRET`, `INTERNAL_SERVICE_KEY`, DB credentials) come from `bcube-services/.env`
(local) or the root `.env` (Docker) - see the root README. Service-specific values go into
`bcube-services/access-service/.env` (template: `.env.example`):

`ACCESS_AES_KEY` (base64, 32 bytes - encrypts stored codes), `NUKI_API_TOKEN`, `NUKI_MOCK_ENABLED` (default `true`, set `false` in production), `FRONTEND_URL`

Spring profile `docker` (used in containers) switches to the datasource and service URLs passed in
by `docker-compose.yml` and turns on JSON logging; OpenAPI is off there unless `OPENAPI_ENABLED=true`.

## Run

```bash
cd bcube-services && docker compose up -d      # databases
cd access-service && ./mvnw spring-boot:run              # or start it from the IDE
```

OpenAPI: `http://localhost:8084/v3/api-docs`, Swagger UI at `/swagger-ui.html`.
Health: `/actuator/health`. Every response carries an `X-Request-Id` that also appears in the logs.

## Test

```bash
./mvnw test
```

Tests start a throwaway Postgres 17 with Testcontainers (Docker must be running) and use the
dummy secrets from `src/test/resources/application-test.properties`; no local database or `.env` is needed.

## Notes

`nuki.mock-enabled` defaults to `true` while Nuki is deactivated - with it on, codes are generated but no real lock is touched.

