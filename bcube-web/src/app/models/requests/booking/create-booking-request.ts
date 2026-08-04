export interface CreateBookingRequest {
    userID: number,
    studioID: number,
    smartlockID: number,
    date: string,
    startTime: string,
    endTime: string,
    voucherCode?: string
}