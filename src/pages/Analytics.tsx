import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FundGoalSheet, NewGoalSheet } from '../components/GoalSheets'
import { GoalShape } from '../components/GoalShape'
import { IconBack, IconBars, IconCalendar, IconChevronRight, IconPie, IconPlus } from '../components/Icons'
import { categoryOf } from '../lib/categories'
import { addDays, compactMoney, startOfWeek } from '../lib/format'
import type { Goal, Transaction, TxKind } from '../lib/types'
import { useData, useSession } from '../state'

function niceMax(v: number) {
  if (v <= 0) return 100
  const pow = 10 ** Math.floor(Math.log10(v))
  const step = [1, 2, 2.5, 5, 10].find((s) => s * pow * 4 >= v)! * pow
  return step * 4
}

export function Analytics() {
  const { store } = useSession()
  const { recent, goals, money, profile } = useData()
  const loc = useLocation()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [kind, setKind] = useState<TxKind>('expense')
  const [view, setView] = useState<'bars' | 'pie'>('bars')
  const [picker, setPicker] = useState(false)
  const [txs, setTxs] = useState<Transaction[]>([])
  const [sel, setSel] = useState<number | null>(null)
  const [newGoal, setNewGoal] = useState(false)
  const [fund, setFund] = useState<Goal | null>(null)

  useEffect(() => {
    store.listTransactions({ from: weekStart, to: addDays(weekStart, 7) }).then(setTxs).catch(() => setTxs([]))
  }, [store, weekStart, recent])

  useEffect(() => {
    if (loc.hash === '#goals') document.getElementById('goals')?.scrollIntoView({ behavior: 'smooth' })
  }, [loc.hash])

  const days = useMemo(() => {
    const out = Array.from({ length: 7 }, (_, i) => ({ date: addDays(weekStart, i), total: 0 }))
    for (const t of txs) {
      if (t.kind !== kind) continue
      const i = Math.floor((new Date(t.occurred_at).getTime() - weekStart.getTime()) / 86_400_000)
      if (out[i]) out[i].total += t.amount
    }
    return out
  }, [txs, kind, weekStart])

  const byCategory = useMemo(() => {
    const m = new Map<string, number>()
    for (const t of txs) if (t.kind === kind) m.set(t.category, (m.get(t.category) ?? 0) + t.amount)
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [txs, kind])

  const weekTotal = days.reduce((s, d) => s + d.total, 0)
  const max = niceMax(Math.max(...days.map((d) => d.total)))
  const todayIdx = days.findIndex((d) => d.date.toDateString() === new Date().toDateString())
  const active = sel ?? (todayIdx >= 0 ? todayIdx : days.reduce((bi, d, i, a) => (d.total > a[bi]!.total ? i : bi), 0))
  const isThisWeek = todayIdx >= 0
  const cur = profile?.currency ?? 'USD'

  const rangeLabel = `${weekStart.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} – ${addDays(weekStart, 6).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`

  return (
    <main className="page">
      <header className="bar-head">
        <span className="icon-btn-spacer" />
        <h1>Analytics</h1>
        <button className={`icon-btn ${picker ? 'pressed' : ''}`} onClick={() => setPicker((p) => !p)} aria-label="Choose week" aria-expanded={picker}>
          <IconCalendar />
        </button>
      </header>

      {picker && (
        <div className="week-picker">
          <button className="icon-btn" onClick={() => (setWeekStart((w) => addDays(w, -7)), setSel(null))} aria-label="Previous week">
            <IconBack size={18} />
          </button>
          <span>{isThisWeek ? `This week · ${rangeLabel}` : rangeLabel}</span>
          <button className="icon-btn" disabled={isThisWeek} onClick={() => (setWeekStart((w) => addDays(w, 7)), setSel(null))} aria-label="Next week">
            <IconChevronRight size={18} />
          </button>
        </div>
      )}

      <div className="an-tabs">
        <div role="tablist">
          {(['expense', 'income'] as const).map((k) => (
            <button key={k} role="tab" aria-selected={kind === k} className={kind === k ? 'on' : ''} onClick={() => (setKind(k), setSel(null))}>
              {k === 'expense' ? 'Expenses' : 'Income'}
            </button>
          ))}
        </div>
        <div className="an-views">
          <button className={view === 'bars' ? 'on' : ''} onClick={() => setView('bars')} aria-label="Bar chart">
            <IconBars size={20} />
          </button>
          <button className={view === 'pie' ? 'on' : ''} onClick={() => setView('pie')} aria-label="By category">
            <IconPie size={20} />
          </button>
        </div>
      </div>
      <p className="an-total">
        <span className="num">{money(weekTotal)}</span> {isThisWeek ? 'this week' : rangeLabel}
      </p>

      {view === 'bars' ? (
        <div className="chart" role="img" aria-label={`${kind} per day`}>
          <div className="chart-axis num" aria-hidden="true">
            {[4, 3, 2, 1, 0].map((i) => (
              <span key={i}>{compactMoney((max / 4) * i, cur).replace(/\.0(?=\D*$)/, '')}</span>
            ))}
          </div>
          <div className="chart-plot">
            {days.map((d, i) => {
              const h = (d.total / max) * 100
              return (
                <button
                  key={i}
                  className={`bar-col ${i === active ? 'on' : ''}`}
                  onClick={() => setSel(i)}
                  aria-label={`${d.date.toLocaleDateString(undefined, { weekday: 'long' })}: ${money(d.total)}`}
                >
                  <span className="bar-track">
                    <span className="bar" style={{ height: `${Math.max(h, d.total > 0 ? 3 : 0)}%` }}>
                      {i === active && (
                        <span className="tip">
                          <small>{d.date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</small>
                          <b className="num">{money(d.total)}</b>
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="bar-day">{d.date.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <Donut data={byCategory} total={weekTotal} money={money} />
      )}

      <section id="goals">
        <div className="section-head">
          <h2>Savings Goals</h2>
          <button className="icon-btn soft" onClick={() => setNewGoal(true)} aria-label="New goal">
            <IconPlus />
          </button>
        </div>
        <div className="goals">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.saved / g.target) * 100))
            return (
              <button key={g.id} className="goal" onClick={() => setFund(g)} aria-label={`${g.name}, ${pct}% saved`}>
                <span className={`goal-fill tint-grad-${g.tint}`} style={{ width: `max(${pct}%, 58px)` }} />
                <span className="goal-content">
                  <GoalShape icon={g.icon} />
                  <span className="goal-name">{g.name}</span>
                  <span className="goal-pct num">{pct}%</span>
                </span>
              </button>
            )
          })}
          {goals.length === 0 && (
            <button className="empty goal-empty" onClick={() => setNewGoal(true)}>
              Start a savings goal
            </button>
          )}
        </div>
      </section>

      <NewGoalSheet open={newGoal} onClose={() => setNewGoal(false)} />
      <FundGoalSheet goal={fund} onClose={() => setFund(null)} />
    </main>
  )
}

function Donut({ data, total, money }: { data: [string, number][]; total: number; money(n: number): string }) {
  if (total <= 0) return <p className="muted center chart-empty">No data for this week yet.</p>
  const R = 52
  const C = 2 * Math.PI * R
  let offset = 0
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 140 140" className="donut" role="img" aria-label="Share by category">
        {data.map(([cat, v]) => {
          const len = (v / total) * C
          const el = (
            <circle
              key={cat}
              cx="70"
              cy="70"
              r={R}
              className={`seg stroke-${categoryOf(cat).tint}`}
              strokeDasharray={`${Math.max(len - 2, 0.5)} ${C}`}
              strokeDashoffset={-offset}
            />
          )
          offset += len
          return el
        })}
        <text x="70" y="66" className="donut-k">
          Total
        </text>
        <text x="70" y="84" className="donut-v num">
          {money(total)}
        </text>
      </svg>
      <ul className="legend">
        {data.map(([cat, v]) => (
          <li key={cat}>
            <i className={`dot tint-${categoryOf(cat).tint}`} />
            <span>{categoryOf(cat).label}</span>
            <span className="num">{Math.round((v / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
