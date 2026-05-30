/**
 * Formats a certificate uuid into the human-readable Verification ID shown on
 * the certificate (e.g. "0E930A71-7260"). Derived from the stored uuid so the
 * printed ID and the public lookup key always match.
 */
export function formatVerificationId(certId: string): string {
  const hex = certId.replace(/-/g, '').toUpperCase();
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}`;
}
