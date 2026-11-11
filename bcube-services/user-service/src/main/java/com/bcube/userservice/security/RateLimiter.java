package com.bcube.userservice.security;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Minimal in-memory fixed-window limiter for the unauthenticated auth endpoints (login, reset
 * flow). Keyed by action + email rather than client IP: behind nginx and the gateway every
 * request arrives from the same proxy address, and X-Forwarded-For is client-controllable, so an
 * IP key would either throttle everyone together or be trivially bypassed. Per-instance state is
 * enough while there is one instance per service; real per-IP throttling belongs at the edge
 * (e.g. a WAF rate rule) once this is deployed behind a load balancer.
 */
@Component
public class RateLimiter {

    private static final Duration WINDOW = Duration.ofMinutes(15);
    private static final int PRUNE_THRESHOLD = 10_000;

    private record Window(Instant start, int count) {}

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    /** Counts one attempt for {@code action}/{@code email}; throws 429 once {@code max} is exceeded. */
    public void check(String action, String email, int max) {
        Instant now = Instant.now();
        if (windows.size() > PRUNE_THRESHOLD) {
            windows.entrySet().removeIf(e -> e.getValue().start().plus(WINDOW).isBefore(now));
        }
        String key = action + ":" + (email == null ? "" : email.trim().toLowerCase(Locale.ROOT));
        Window w = windows.compute(key, (k, old) ->
                old == null || old.start().plus(WINDOW).isBefore(now)
                        ? new Window(now, 1)
                        : new Window(old.start(), old.count() + 1));
        if (w.count() > max) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Zu viele Versuche. Bitte warte einige Minuten und versuche es erneut.");
        }
    }

    /** Forgets the counter, e.g. after a successful login. */
    public void reset(String action, String email) {
        windows.remove(action + ":" + (email == null ? "" : email.trim().toLowerCase(Locale.ROOT)));
    }
}
