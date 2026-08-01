import { BookingStatus } from "../../BookingStatus";
import { Studio } from "../../Studio";
import { User } from "../../User";

export interface BookingDetailsResponse {
    id: number;
    user: User;
    studio: Studio;
    date: string;
    startTime: string;
    endTime: string;
    status: BookingStatus;
    accessCode: string;
}