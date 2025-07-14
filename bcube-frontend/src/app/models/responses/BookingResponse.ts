import { BookingStatus } from "../BookingStatus";
import { studio } from "../studio";
import { User } from "../user";

export interface BookingResponse {
    id: number,
    user: User,
    studio: studio,
    date: string,
    startTime: string,
    endTime: string,
    status: BookingStatus
}