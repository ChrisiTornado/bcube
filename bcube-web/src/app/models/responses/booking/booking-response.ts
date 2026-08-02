import { BookingStatus } from "@models/booking-status.model";
import { Studio } from "@models/studio.model";
import { User } from "@models/user.model";

export interface BookingResponse {
    id: number;
    user: User;
    studio: Studio;
    date: string;
    startTime: string;
    endTime: string;
    status: BookingStatus;
}