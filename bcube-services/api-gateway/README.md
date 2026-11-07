# api-gateway

Single entry point for the browser (Spring Cloud Gateway on WebFlux). Routes by path to the services,
validates the JWT in front of them and answers CORS preflights.

| | |
| --- | --- |
| Port | `8080` |
| Routes | `/api/auth`, `/oauth2`, `/login`, `/api/users`, `/api/admin/users` -> user-service; `/api/studios`, `/api/admin/studios` -> studio-service; `/api/bookings` -> booking-service; `/api/payments`, `/api/admin/payments` -> payment-service |
| Not routed | `access-service` (internal only), `/api/notifications`, the payment-status callback |

## Authentication

Public routes (login/register, Stripe webhook, OAuth, guest reads of studios and slots) skip the JWT
filter; everything else needs a valid token, and `/api/admin/**` needs `ROLE_ADMIN`. Each service
validates the token again itself.

## Configuration

Route targets are environment driven; the defaults are the local ports:
`USER_SERVICE_URL`, `STUDIO_SERVICE_URL`, `BOOKING_SERVICE_URL`, `PAYMENT_SERVICE_URL`.
`JWT_SECRET` comes from `bcube-services/.env` (local) or the root `.env` (Docker).

The IDE run configuration must use `com.bcube.apigateway.ApiGatewayApplication`.

## Run / Test

```bash
cd api-gateway && ./mvnw spring-boot:run
./mvnw test
```

A request that fails with `502` from the frontend (`ng serve` or nginx) usually means this gateway is not running.
Every request gets an `X-Request-Id` that is forwarded to the services and returned to the client.
