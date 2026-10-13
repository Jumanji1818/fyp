export function formatCurrency(
  amount: number | string | undefined | null,
  currency: string = '₦',
  includeDecimals = false
): string {
  const sym = currency === 'NGN' || currency === 'Naira' || !currency ? '₦' : currency;
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return includeDecimals ? `${sym}0.00` : `${sym}0`;
  }
  const num = Number(amount);
  return (
    sym +
    num.toLocaleString('en-US', {
      minimumFractionDigits: includeDecimals ? 2 : 0,
      maximumFractionDigits: includeDecimals ? 2 : 0,
    })
  );
}

export function formatNaira(amount: number | string | undefined | null, includeDecimals = true): string {
  return formatCurrency(amount, '₦', includeDecimals);
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
