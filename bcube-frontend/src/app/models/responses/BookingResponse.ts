import { BookingStatus } from "../BookingStatus";

export interface BookingResponse {
    id: number,
    userID: number,
    studioID: number,
    date: string,
    startTime: string,
    endTime: string,
    status: BookingStatus
}