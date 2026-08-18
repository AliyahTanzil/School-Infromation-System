export function formatLe(value, { minor = true } = {}) {
  const amount = Number(value ?? 0) / (minor ? 100 : 1);
  return `Le ${new Intl.NumberFormat('en-SL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
}
