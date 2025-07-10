import { BookingStatus } from "./BookingStatus"
import { studio } from "./studio";
import { User } from "./user";

export interface booking {
    id: number,
    studio: studio;
    user: User;
    date: string,
    startTime: string,
    endTime: string,
    status: BookingStatus
}