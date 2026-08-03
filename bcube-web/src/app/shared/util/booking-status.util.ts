import { BookingStatus } from '@models/booking-status.model';

const BOOKING_STATUS_LABELS: Record<string, string> = {
  [BookingStatus.CONFIRMED]: 'Bestätigt',
  [BookingStatus.DONE]: 'Abgeschlossen',
  [BookingStatus.CANCELLED]: 'Storniert',
  [BookingStatus.PENDING]: 'Ausstehend',
  [BookingStatus.FAILED]: 'Fehlgeschlagen'
};

export function getBookingStatusLabel(status: string): string {
  return BOOKING_STATUS_LABELS[status] ?? status;
}
