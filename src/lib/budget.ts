import { NOT_SPENDING } from './categories'
import { daysInMonth, round2, startOfDay, startOfMonth } from './format'
import type { CategoryId, Summary, TxKind } from './types'

type Row = { amount: number; kind: TxKind; category: string; occurred_at: string }

/** Month figures from this month's rows; balance comes from elsewhere. */
export function summarize(rows: Row[], balance: number, now = new Date()): Summary {
  const m = startOfMonth(now).getTime()
  const today = startOfDay(now).getTime()
  const s: Summary = { balance: round2(balance), monthIncome: 0, monthExpense: 0, monthSpend: 0, todaySpend: 0 }
  for (const r of rows) {
    const t = new Date(r.occurred_at).getTime()
    if (t < m) continue
    if (r.kind === 'income') {
      s.monthIncome += r.amount
      continue
    }
    s.monthExpense += r.amount
    if (NOT_SPENDING.includes(r.category as CategoryId)) continue
    s.monthSpend += r.amount
    if (t >= today) s.todaySpend += r.amount
  }
  return s
}

export interface Allowance {
  budget: number
  daysLeft: number
  /** What you can spend per day for the rest of the month, fixed at the start of today. */
  daily: number
  /** daily − spent today; negative means over. */
  leftToday: number
  remaining: number
  /** Fraction of the month elapsed (0–1), for the pace marker. */
  pace: number
  /** Fraction of budget spent (0–1+). */
  used: number
}

export function allowance(s: Summary, budget: number, now = new Date()): Allowance {
  const dim = daysInMonth(now)
  const daysLeft = dim - now.getDate() + 1
  const beforeToday = s.monthSpend - s.todaySpend
  const daily = Math.max(0, (budget - beforeToday) / daysLeft)
  const elapsed = (now.getDate() - 1 + (now.getHours() + now.getMinutes() / 60) / 24) / dim
  return {
    budget,
    daysLeft,
    daily,
    leftToday: daily - s.todaySpend,
    remaining: budget - s.monthSpend,
    pace: elapsed,
    used: budget > 0 ? s.monthSpend / budget : 0,
  }
}
