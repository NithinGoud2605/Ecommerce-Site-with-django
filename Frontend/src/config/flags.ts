// Runtime feature flags
// Strictly parse VITE_CATALOG_SUPABASE_READS into a boolean.
// Accepted truthy values: 'true', '1', 'yes', 'on' (case-insensitive)
// Any other value (including undefined) becomes false.

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

// Vite exposes env via import.meta.env
// Use any to avoid type issues in plain TS without vite/client types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rawFlag = (import.meta as any)?.env?.VITE_CATALOG_SUPABASE_READS;
export const CATALOG_SUPABASE_READS: boolean = parseBoolean(rawFlag);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if ((import.meta as any)?.env?.DEV) {
  // eslint-disable-next-line no-console
  console.debug('[flags] VITE_CATALOG_SUPABASE_READS =', rawFlag, '=>', CATALOG_SUPABASE_READS);
}

// PayPal toggle
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rawPaypal = (import.meta as any)?.env?.VITE_PAYPAL_ENABLED;
export const PAYPAL_ENABLED: boolean = parseBoolean(rawPaypal);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if ((import.meta as any)?.env?.DEV) {
  // eslint-disable-next-line no-console
  console.debug('[flags] VITE_PAYPAL_ENABLED =', rawPaypal, '=>', PAYPAL_ENABLED);
}


