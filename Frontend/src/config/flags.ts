// Runtime feature flags
// Supabase catalog reads are disabled to ensure Django-only data flow.
export const CATALOG_SUPABASE_READS: boolean = false;

// PayPal toggle
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rawPaypal = (import.meta as any)?.env?.VITE_PAYPAL_ENABLED;
function parseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase();
  return (
    normalized === 'true' ||
    normalized === '1' ||
    normalized === 'yes' ||
    normalized === 'on' ||
    normalized === 'y' ||
    normalized === 't'
  );
}
export const PAYPAL_ENABLED: boolean = parseBoolean(rawPaypal);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if ((import.meta as any)?.env?.DEV) {
  // eslint-disable-next-line no-console
  console.debug('[flags] VITE_PAYPAL_ENABLED =', rawPaypal, '=>', PAYPAL_ENABLED);
}


