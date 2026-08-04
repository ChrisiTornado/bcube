import { getPaymentStatusLabel } from './payment-status.util';

describe('getPaymentStatusLabel', () => {
  it('maps known statuses to German labels', () => {
    expect(getPaymentStatusLabel('SUCCEEDED')).toBe('Bezahlt');
    expect(getPaymentStatusLabel('FREE')).toBe('Kostenlos');
    expect(getPaymentStatusLabel('REFUNDED')).toBe('Erstattet');
  });

  it('falls back to the raw status for unknown values', () => {
    expect(getPaymentStatusLabel('SOMETHING_NEW')).toBe('SOMETHING_NEW');
  });
});
