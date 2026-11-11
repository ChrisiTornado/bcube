# studio-service

Studio data (address, price, geocoding) and the studio image gallery.

| | |
| --- | --- |
| Port | `8082` |
| Database | PostgreSQL `bcube_studio_service` (local dev: `localhost:5434`, started by `bcube-services/docker-compose.yml`) |
| Calls | booking-service (removes a studio's bookings before deleting it), Nominatim (geocoding on create/update). |
| Called by | api-gateway (`/api/studios`, `/api/admin/studios`); booking-service reads `/api/studios/{id}/summary`. |

## Authentication

`GET /api/studios/**` is public, `/api/admin/studios/**` needs `ROLE_ADMIN` (JWT validated locally).

## Configuration

Shared values (`JWT_SECRET`, `INTERNAL_SERVICE_KEY`, DB credentials) come from `bcube-services/.env`
(local) or the root `.env` (Docker) - see the root README. Service-specific values go into
`bcube-services/studio-service/.env` (template: `.env.example`):

`FRONTEND_URL`, `BOOKING_SERVICE_BASE_URL`, `AWS_S3_REGION`/`AWS_S3_BUCKET`/`AWS_S3_PUBLIC_URL_BASE` (optional, S3 is not wired in yet)

Spring profile `docker` (used in containers) switches to the datasource and service URLs passed in
by `docker-compose.yml` and turns on JSON logging; OpenAPI is off there unless `OPENAPI_ENABLED=true`.

## Run

```bash
cd bcube-services && docker compose up -d      # databases
cd studio-service && ./mvnw spring-boot:run              # or start it from the IDE
```

OpenAPI: `http://localhost:8082/v3/api-docs`, Swagger UI at `/swagger-ui.html`.
Health: `/actuator/health`. Every response carries an `X-Request-Id` that also appears in the logs.

## Test

```bash
./mvnw test
```

Tests start a throwaway Postgres 17 with Testcontainers (Docker must be running) and use the
dummy secrets from `src/test/resources/application-test.properties`; no local database or `.env` is needed.

## Notes

Images are stored in `studio_images` as two scaled JPEGs (480 px thumbnail, 1600 px display size); uploads are scaled on write.

| Endpoint | Image data |
| --- | --- |
| `GET /api/studios/page`, `GET /api/studios` | thumbnails (`imageBase64`, `imageGalleryBase64`) |
| `GET /api/studios/{id}` | display-size images |
| `GET /api/studios/{id}/summary` | first thumbnail only, no gallery (service-to-service) |
| `GET /api/studios/{id}/images/{n}?size=thumb\|full` | one image, `immutable` cache headers + ETag |

`thumbnailUrl` / `imageUrls` in the responses point at the image endpoint for clients that load images themselves. If a client sends back a thumbnail or display-size image it received earlier, the stored image is kept (matched by hash), so editing from a list cannot degrade a gallery. Studios created before `V2` are converted at startup by `LegacyImageMigration`; the old columns `image_data` / `image_gallery_json` can be dropped once that has run everywhere.

