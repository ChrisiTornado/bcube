import { BookingStatus } from "@models/booking-status.model"
import { Studio } from "@models/studio.model";
import { User } from "@models/user.model";

export interface Booking {
    id: number;
    studio: Studio;
    user: User;
    date: string;
    startTime: string;
    endTime: string;
    status: BookingStatus;
}