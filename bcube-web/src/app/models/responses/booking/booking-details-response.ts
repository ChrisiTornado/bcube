import { BookingStatus } from "@models/booking-status.model";
import { Studio } from "@models/studio.model";
import { User } from "@models/user.model";

export interface BookingDetailsResponse {
    id: number;
    user: User;
    // Nullable defensively - see booking.model.ts.
    studio: Studio | null;
    date: string;
    startTime: string;
    endTime: string;
    status: BookingStatus;
    accessCode: string | null;
    clientSecret: string | null;
    amountDueCents: number | null;
}