package com.bcube.bookingservice.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingSchemaCleanup {

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void cleanupBookingSchema() {
        refreshBookingStatusConstraint();
        dropLegacyBookingSlotConstraint();
    }

    private void refreshBookingStatusConstraint() {
        List<String> statusConstraintNames = jdbcTemplate.query(
                """
                SELECT con.conname
                FROM pg_constraint con
                JOIN pg_class rel ON rel.oid = con.conrelid
                JOIN pg_attribute attr ON attr.attrelid = rel.oid AND attr.attnum = ANY(con.conkey)
                WHERE rel.relname = 'bookings'
                  AND con.contype = 'c'
                  AND attr.attname = 'status'
                """,
                (rs, rowNum) -> rs.getString("conname")
        );

        for (String constraintName : statusConstraintNames) {
            jdbcTemplate.execute("ALTER TABLE bookings DROP CONSTRAINT IF EXISTS " + constraintName);
            log.info("Dropped outdated booking status constraint: {}", constraintName);
        }

        jdbcTemplate.execute(
                """
                ALTER TABLE bookings
                ADD CONSTRAINT bookings_status_check
                CHECK (status IN ('CONFIRMED', 'PENDING', 'FAILED', 'DONE', 'CANCELLED'))
                """
        );
        log.info("Ensured booking status constraint includes DONE");
    }

    private void dropLegacyBookingSlotConstraint() {
        List<String> constraintNames = jdbcTemplate.query(
                """
                SELECT con.conname
                FROM pg_constraint con
                JOIN pg_class rel ON rel.oid = con.conrelid
                WHERE rel.relname = 'bookings'
                  AND con.contype = 'u'
                  AND pg_get_constraintdef(con.oid) ILIKE '%studio_id%'
                  AND pg_get_constraintdef(con.oid) ILIKE '%start_time%'
                """,
                (rs, rowNum) -> rs.getString("conname")
        );

        for (String constraintName : constraintNames) {
            jdbcTemplate.execute("ALTER TABLE bookings DROP CONSTRAINT IF EXISTS " + constraintName);
            log.info("Dropped legacy booking unique constraint: {}", constraintName);
        }
    }
}
