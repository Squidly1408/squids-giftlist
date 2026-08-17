export function formatMoney(price: number | null | undefined, currency: string | null | undefined) {
  if (price == null) return null
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency ?? 'USD' }).format(price)
  } catch {
    return `$${price.toFixed(2)}`
  }
}

export function isValidUrl(value: string) {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function hostnameOf(url: string | null | undefined) {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

export function daysUntil(date: Date | null | undefined) {
  if (!date) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - now.getTime()) / 86_400_000)
}

export function formatCountdown(date: Date | null | undefined) {
  const days = daysUntil(date)
  if (days == null) return null
  if (days < 0) return 'Past'
  if (days === 0) return 'Today!'
  if (days === 1) return 'Tomorrow'
  return `${days} days`
}
