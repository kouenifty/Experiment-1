import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconBack, IconChevronRight } from '../components/Icons'
import { CATEGORIES, categoryOf, NOT_SPENDING } from '../lib/categories'
import { addDays, addMonths, DAY, shortDate, startOfDay, startOfMonth, startOfWeek } from '../lib/format'
import type { CategoryId, Transaction, TxKind } from '../lib/types'
import { useData, useSession } from '../state'

type Period = 'week' | 'month'

function range(period: Period, offset: number) {
  const now = new Date()
  const start = period === 'week' ? addDays(startOfWeek(now), offset * 7) : addMonths(startOfMonth(now), offset)
  const end = period === 'week' ? addDays(start, 7) : addMonths(start, 1)
  const prevStart = period === 'week' ? addDays(start, -7) : addMonths(start, -1)
  return { start, end, prevStart, days: Math.round((end.getTime() - start.getTime()) / DAY) }
}

function niceMax(v: number) {
  if (v <= 0) return 100
  const pow = 10 ** Math.floor(Math.log10(v))
  const step = [1, 2, 2.5, 5, 10].find((s) => s * pow * 4 >= v)! * pow
  return step * 4
}

const counts = (t: Transaction, kind: TxKind) => t.kind === kind && !(kind === 'expense' && NOT_SPENDING.includes(t.category))

export function Insights() {
  const { store } = useSession()
  const { recent, money } = useData()
  const nav = useNavigate()
  const [period, setPeriod] = useState<Period>('week')
  const [offset, setOffset] = useState(0)
  const [kind, setKind] = useState<TxKind>('expense')
  const [txs, setTxs] = useState<Transaction[] | null>(null)
  const [sel, setSel] = useState<number | null>(null)

  const { start, end, prevStart, days } = useMemo(() => range(period, offset), [period, offset])

  useEffect(() => {
    store.listTransactions({ from: prevStart, to: end }).then(setTxs).catch(() => setTxs([]))
  }, [store, prevStart, end, recent])

  const now = new Date()
  const isCurrent = offset === 0
  // Days of the period that have happened (all of them for past periods).
  const elapsed = isCurrent ? Math.floor((startOfDay(now).getTime() - start.getTime()) / DAY) + 1 : days

  const data = useMemo(() => {
    const buckets = Array.from({ length: days }, (_, i) => ({ date: addDays(start, i), total: 0 }))
    const cats = new Map<CategoryId, number>()
    let total = 0
    let prev = 0
    let count = 0
    for (const t of txs ?? []) {
      if (!counts(t, kind)) continue
      const at = new Date(t.occurred_at)
      if (at >= start) {
        const i = Math.floor((startOfDay(at).getTime() - start.getTime()) / DAY)
        if (buckets[i]) buckets[i].total += t.amount
        cats.set(t.category, (cats.get(t.category) ?? 0) + t.amount)
        total += t.amount
        count++
      } else {
        // Compare with the same stretch of the previous period, so a half-finished week isn't judged against a full one.
        const i = Math.floor((startOfDay(at).getTime() - prevStart.getTime()) / DAY)
        if (i < elapsed) prev += t.amount
      }
    }
    return { buckets, cats: [...cats.entries()].sort((a, b) => b[1] - a[1]), total, prev, count }
  }, [txs, kind, start, prevStart, days, elapsed])

  const max = niceMax(Math.max(...data.buckets.map((b) => b.total)))
  const todayIdx = isCurrent ? elapsed - 1 : -1
  const biggest = data.buckets.reduce((bi, b, i, a) => (b.total > a[bi]!.total ? i : bi), 0)
  const active = sel ?? (todayIdx >= 0 && data.buckets[todayIdx]!.total > 0 ? todayIdx : biggest)
  const delta = data.prev > 0 ? (data.total - data.prev) / data.prev : null
  const good = delta !== null && (kind === 'expense' ? delta <= 0 : delta >= 0)
  const prevName = period === 'week' ? 'last week' : 'last month'

  const title =
    period === 'week'
      ? offset === 0
        ? 'This week'
        : offset === -1
          ? 'Last week'
          : `${shortDate(start)} – ${shortDate(addDays(end, -1))}`
      : start.toLocaleDateString('en-MY', { month: 'long', year: start.getFullYear() === now.getFullYear() ? undefined : 'numeric' })

  const change = (p: Period) => {
    setPeriod(p)
    setOffset(0)
    setSel(null)
  }
  const step = (d: number) => {
    setOffset((o) => o + d)
    setSel(null)
  }

  return (
    <main className="page">
      <header className="bar-head">
        <span className="icon-btn-spacer" />
        <h1>Insights</h1>
        <span className="icon-btn-spacer" />
      </header>

      <div className="segmented">
        {(['week', 'month'] as const).map((p) => (
          <button key={p} className={period === p ? 'on' : ''} onClick={() => change(p)}>
            {p === 'week' ? 'Week' : 'Month'}
          </button>
        ))}
      </div>

      <div className="period-nav">
        <button className="icon-btn" onClick={() => step(-1)} aria-label={`Previous ${period}`}>
          <IconBack size={18} />
        </button>
        <span>{title}</span>
        <button className="icon-btn" onClick={() => step(1)} disabled={isCurrent} aria-label={`Next ${period}`}>
          <IconChevronRight size={18} />
        </button>
      </div>

      <div className="an-tabs" role="tablist">
        {(['expense', 'income'] as const).map((k) => (
          <button key={k} role="tab" aria-selected={kind === k} className={kind === k ? 'on' : ''} onClick={() => (setKind(k), setSel(null))}>
            {k === 'expense' ? 'Spent' : 'Received'}
          </button>
        ))}
      </div>

      <div className="an-head">
        <strong className="num amt">{money(data.total)}</strong>
        {delta !== null && (
          <span className={`pill ${good ? 'good' : 'bad'}`}>
            {delta > 0 ? '▲' : delta < 0 ? '▼' : '='} {Math.abs(Math.round(delta * 100))}% vs {isCurrent ? `this point ${prevName}` : prevName}
          </span>
        )}
      </div>

      <div className={`chart ${period}`} role="img" aria-label={`${kind === 'expense' ? 'Spending' : 'Income'} per day, ${title}`}>
        <div className="chart-axis num" aria-hidden="true">
          {[4, 3, 2, 1, 0].map((i) => (
            <span key={i}>{Math.round((max / 4) * i).toLocaleString('en-MY')}</span>
          ))}
        </div>
        <div className="chart-plot" style={{ gridTemplateColumns: `repeat(${days}, 1fr)` }}>
          {data.buckets.map((b, i) => {
            const future = isCurrent && i > todayIdx
            const label =
              period === 'week'
                ? b.date.toLocaleDateString('en-MY', { weekday: 'short' })
                : [0, 7, 14, 21, 28].includes(i)
                  ? String(i + 1)
                  : ''
            return (
              <button
                key={i}
                className={`bar-col ${i === active ? 'on' : ''} ${future ? 'future' : ''}`}
                onClick={() => setSel(i)}
                disabled={future}
                aria-label={`${b.date.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long' })}: ${money(b.total)}`}
              >
                <span className="bar-track">
                  <span className="bar" style={{ height: `${b.total > 0 ? Math.max((b.total / max) * 100, 2.5) : 0}%` }}>
                    {i === active && (
                      <span className={`tip ${i < days * 0.2 ? 'tip-left' : i > days * 0.8 ? 'tip-right' : ''}`}>
                        <small>{shortDate(b.date)}</small>
                        <b className="num amt">{money(b.total)}</b>
                      </span>
                    )}
                  </span>
                </span>
                <span className="bar-day">{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mini-stats">
        <div>
          <span>Daily average</span>
          <strong className="num amt">{money(data.total / Math.max(1, elapsed))}</strong>
        </div>
        <div>
          <span>Biggest day</span>
          <strong className="num">{data.buckets[biggest]!.total > 0 ? shortDate(data.buckets[biggest]!.date) : '—'}</strong>
        </div>
        <div>
          <span>Transactions</span>
          <strong className="num">{data.count}</strong>
        </div>
      </div>

      <section>
        <div className="section-head">
          <h2>By category</h2>
        </div>
        {txs !== null && data.cats.length === 0 && <p className="muted pad">Nothing recorded for this period.</p>}
        <ul className="cat-list">
          {data.cats.map(([c, v]) => {
            const meta = categoryOf(c)
            const share = data.total > 0 ? v / data.total : 0
            return (
              <li key={c}>
                <button onClick={() => nav(`/transactions?cat=${c}`)} aria-label={`${meta.label}: ${money(v)}, ${Math.round(share * 100)}%. Show transactions`}>
                  <span className={`cat-emoji tint-${meta.tint}`} aria-hidden="true">
                    {CATEGORIES[c]?.emoji ?? meta.emoji}
                  </span>
                  <span className="cat-body">
                    <span className="cat-line">
                      <span>{meta.label}</span>
                      <span className="num amt">{money(v)}</span>
                    </span>
                    <span className="cat-bar">
                      <span className={`tint-${meta.tint}`} style={{ width: `${share * 100}%` }} />
                    </span>
                  </span>
                  <span className="cat-pct num">{Math.round(share * 100)}%</span>
                </button>
              </li>
            )
          })}
        </ul>
        {kind === 'expense' && <p className="muted tiny">Money moved into savings goals isn’t counted as spending.</p>}
      </section>
    </main>
  )
}
