package com.bcube.bookingservice.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingSchemaCleanup {

    private final JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void dropLegacyBookingSlotConstraint() {
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
