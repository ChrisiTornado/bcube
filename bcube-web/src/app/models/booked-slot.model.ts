import { BookingStatus } from '@models/booking-status.model';

/** Anonymous occupancy of a studio (no booking id or user) - what the public studio calendar shows. */
export interface BookedSlot {
    date: string;
    startTime: string;
    endTime: string;
    status: BookingStatus;
}
