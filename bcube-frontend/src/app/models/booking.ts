import { BookingStatus } from "./BookingStatus"

export interface booking {
    id: number,
    userID: number,
    studioID: number,
    date: string,
    startTime: string,
    endTime: string,
    status: BookingStatus
}