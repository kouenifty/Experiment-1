const LOCALE = 'en-MY'
const fmtCache = new Map<string, Intl.NumberFormat>()

function formatter(currency: string) {
  let f = fmtCache.get(currency)
  if (!f) {
    try {
      f = new Intl.NumberFormat(LOCALE, { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 })
    } catch {
      f = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'MYR', minimumFractionDigits: 2 })
    }
    fmtCache.set(currency, f)
  }
  return f
}

/** "RM 1,234.50" — a thin gap between the symbol and the figure reads better at large sizes. */
export function money(n: number, currency = 'MYR', opts: { sign?: boolean; whole?: boolean } = {}) {
  const v = opts.whole ? Math.round(Math.abs(n)) : Math.abs(n)
  let s = formatter(currency)
    .formatToParts(v)
    .filter((p) => !(opts.whole && (p.type === 'decimal' || p.type === 'fraction')))
    .map((p) => p.value)
    .join('')
  s = s.replace(/^([^\d\s]+)(?=\d)/, '$1 ')
  if (opts.sign) return (n < 0 ? '−' : '+') + s
  return n < 0 ? '−' + s : s
}

export function currencySymbol(currency = 'MYR') {
  return formatter(currency).formatToParts(0).find((p) => p.type === 'currency')?.value ?? currency
}

export const DAY = 86_400_000

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

export function dayLabel(d: Date, now = new Date()) {
  if (sameDay(d, now)) return 'Today'
  if (sameDay(d, addDays(now, -1))) return 'Yesterday'
  return d.toLocaleDateString(LOCALE, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  })
}

export const timeLabel = (d: Date) => d.toLocaleTimeString(LOCALE, { hour: 'numeric', minute: '2-digit' })
export const shortDate = (d: Date) => d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' })
export const monthName = (d = new Date()) => d.toLocaleDateString(LOCALE, { month: 'long' })

export function startOfDay(d: Date) {
  const s = new Date(d)
  s.setHours(0, 0, 0, 0)
  return s
}

export function startOfWeek(d: Date) {
  const s = startOfDay(d)
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7)) // Monday
  return s
}

export function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export const startOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1)
export const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1)
export const daysInMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()

/** Whole months from now until a YYYY-MM-DD date (min 1). */
export function monthsUntil(iso: string, now = new Date()) {
  const d = new Date(iso + 'T00:00:00')
  return Math.max(1, (d.getFullYear() - now.getFullYear()) * 12 + d.getMonth() - now.getMonth())
}

/** Value for <input type="date">. */
export function toDateInput(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('') || '?'

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

export const round2 = (n: number) => Math.round(n * 100) / 100

/** Malay greeting by time of day — a small local touch. */
export function greeting(h = new Date().getHours()) {
  if (h < 5) return 'Selamat malam'
  if (h < 12) return 'Selamat pagi'
  if (h < 14) return 'Selamat tengah hari'
  if (h < 19) return 'Selamat petang'
  return 'Selamat malam'
}

export const vibrate = (ms = 8) => {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* unsupported */
  }
}
