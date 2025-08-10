export function formatMoney({ amount_cents, currency = 'USD', locale = undefined }) {
  const cents = typeof amount_cents === 'number' ? amount_cents : Number(amount_cents) || 0;
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(locale || undefined, { style: 'currency', currency }).format(amount);
  } catch (_) {
    return `${currency} ${amount.toFixed(2)}`;
  }
}


