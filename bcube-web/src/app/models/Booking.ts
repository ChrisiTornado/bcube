import { BookingStatus } from "./BookingStatus"
import { Studio } from "./Studio";
import { User } from "./User";

export interface Booking {
    id: number,
    studio: Studio;
    user: User;
    date: string,
    startTime: string,
    endTime: string,
    status: BookingStatus
}