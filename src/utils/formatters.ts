export function formatNaira(amount: number | string | undefined | null, includeDecimals = true): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '₦0.00';
  }
  const num = Number(amount);
  return '₦' + num.toLocaleString('en-NG', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  });
}

export function formatNumber(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '0';
  }
  return Number(amount).toLocaleString('en-US');
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
