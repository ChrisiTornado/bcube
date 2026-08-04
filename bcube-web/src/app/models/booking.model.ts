import { BookingStatus } from "@models/booking-status.model"
import { Studio } from "@models/studio.model";
import { User } from "@models/user.model";

export interface Booking {
    id: number;
    // Nullable defensively - studio deletion cascades to its bookings, but older data predating
    // that (or a partially-failed cascade) can still leave a booking pointing at a deleted studio.
    studio: Studio | null;
    user: User;
    date: string;
    startTime: string;
    endTime: string;
    status: BookingStatus;
}