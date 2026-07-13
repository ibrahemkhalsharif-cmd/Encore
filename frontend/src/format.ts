export function money(cents: number): string {
  if (cents === 0) return 'Free';
  const hasCents = cents % 100 !== 0;
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  });
}

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

export const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

export const time = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
