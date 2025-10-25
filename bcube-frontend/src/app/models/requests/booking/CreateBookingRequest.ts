export interface CreateBookingRequest {
    userID: number,
    studioID: number,
    date: string,
    startTime: string,
    endTime: string
}