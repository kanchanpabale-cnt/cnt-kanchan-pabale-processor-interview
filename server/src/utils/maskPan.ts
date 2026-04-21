/**
 * Returns a user-safe masked PAN: "**** **** **** 1234".
 * Never include the full PAN in API responses, logs, or error messages.
 */
export function maskPan(pan: string): string {
  const last4 = pan.slice(-4);
  return `**** **** **** ${last4}`;
}

export function getLast4(pan: string): string {
  return pan.slice(-4);
}
