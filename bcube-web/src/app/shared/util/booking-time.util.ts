export function toIsoDate(dateValue: string | Date): string {
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }

  const normalizedDate = dateValue instanceof Date ? dateValue : new Date(dateValue);
  const year = normalizedDate.getFullYear();
  const month = String(normalizedDate.getMonth() + 1).padStart(2, '0');
  const day = String(normalizedDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTimeOfDay(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat('de-AT', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...(timeZone ? { timeZone } : {})
  }).format(date);
}

export function formatBookingTime(value: string, timeZone?: string): string {
  if (!value) {
    return '';
  }

  if (value.includes('T') || value.length > 5) {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return formatTimeOfDay(parsed, timeZone);
    }
  }

  return value.slice(0, 5);
}

export function formatBookingTimeRange(startTime: string, endTime: string, timeZone?: string): string {
  return `${formatBookingTime(startTime, timeZone)} - ${formatBookingTime(endTime, timeZone)}`;
}
