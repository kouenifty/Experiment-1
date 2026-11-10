const fmtCache = new Map<string, Intl.NumberFormat>()

export function money(n: number, currency = 'USD', opts: { sign?: boolean } = {}) {
  const key = currency
  let f = fmtCache.get(key)
  if (!f) {
    try {
      f = new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 2 })
    } catch {
      f = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
    }
    fmtCache.set(key, f)
  }
  const s = f.format(Math.abs(n))
  if (opts.sign) return (n < 0 ? '−' : '+') + s
  return n < 0 ? '−' + s : s
}

export function compactMoney(n: number, currency = 'USD') {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }).format(n)
  } catch {
    return String(Math.round(n))
  }
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

export function dayLabel(d: Date, now = new Date()) {
  const y = new Date(now)
  y.setDate(now.getDate() - 1)
  if (sameDay(d, now)) return 'Today'
  if (sameDay(d, y)) return 'Yesterday'
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric' })
}

export function timeLabel(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export const whenLabel = (iso: string) => {
  const d = new Date(iso)
  return `${dayLabel(d)}, ${timeLabel(d)}`
}

export function startOfWeek(d: Date) {
  const s = new Date(d)
  s.setHours(0, 0, 0, 0)
  const dow = (s.getDay() + 6) % 7 // Monday = 0
  s.setDate(s.getDate() - dow)
  return s
}

export function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

/** Value for <input type="datetime-local"> in local time. */
export function toLocalInput(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
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
