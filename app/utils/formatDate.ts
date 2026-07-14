export function formatDate(date: Date | string | number, locale = 'en-US'): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(d)
}
