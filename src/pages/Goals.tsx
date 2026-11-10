import { useState } from 'react'
import { FundGoalSheet, NewGoalSheet } from '../components/GoalSheets'
import { GoalShape } from '../components/GoalShape'
import { IconPlus } from '../components/Icons'
import { monthsUntil } from '../lib/format'
import type { Goal } from '../lib/types'
import { useData } from '../state'

export function Goals() {
  const { goals, money, loading } = useData()
  const [creating, setCreating] = useState(false)
  const [fund, setFund] = useState<Goal | null>(null)
  const saved = goals.reduce((s, g) => s + g.saved, 0)
  const target = goals.reduce((s, g) => s + g.target, 0)

  return (
    <main className="page">
      <header className="bar-head">
        <span className="icon-btn-spacer" />
        <h1>Savings goals</h1>
        <button className="icon-btn" onClick={() => setCreating(true)} aria-label="New goal">
          <IconPlus />
        </button>
      </header>

      {goals.length > 0 && (
        <div className="goals-summary">
          <span>Saved across {goals.length} {goals.length === 1 ? 'goal' : 'goals'}</span>
          <strong className="num amt">{money(saved)}</strong>
          <span className="muted">
            of <span className="num amt">{money(target, { whole: true })}</span> · {Math.round((saved / target) * 100)}%
          </span>
        </div>
      )}

      <div className="goals">
        {goals.map((g) => {
          const pct = Math.min(100, Math.round((g.saved / g.target) * 100))
          const left = Math.max(0, g.target - g.saved)
          const done = left <= 0
          return (
            <button key={g.id} className="goal-card" onClick={() => setFund(g)} aria-label={`${g.name}, ${pct}% saved. Add or take out money`}>
              <span className="goal">
                <span className={`goal-fill tint-grad-${g.tint}`} style={{ width: `max(${pct}%, 58px)` }} />
                <span className="goal-content">
                  <GoalShape icon={g.icon} />
                  <span className="goal-name">{g.name}</span>
                  <span className="goal-pct num">{pct}%</span>
                </span>
              </span>
              <span className="goal-meta">
                <span>
                  <b className="num amt">{money(g.saved, { whole: true })}</b> of <span className="num">{money(g.target, { whole: true })}</span>
                </span>
                <span>
                  {done
                    ? 'Reached 🎉'
                    : g.deadline
                      ? `${money(left / monthsUntil(g.deadline), { whole: true })}/mo until ${new Date(g.deadline + 'T00:00:00').toLocaleDateString('en-MY', { month: 'short', year: 'numeric' })}`
                      : `${money(left, { whole: true })} to go`}
                </span>
              </span>
            </button>
          )
        })}
        {!loading && goals.length === 0 && (
          <div className="empty">
            <span className="empty-emoji" aria-hidden="true">
              🐷
            </span>
            <p>Saving for something? Raya, a trip, a rainy-day fund. Give it a target and watch it fill up.</p>
            <button className="btn-ink small" onClick={() => setCreating(true)}>
              Create a goal
            </button>
          </div>
        )}
      </div>

      <NewGoalSheet open={creating} onClose={() => setCreating(false)} />
      <FundGoalSheet goal={fund} onClose={() => setFund(null)} />
    </main>
  )
}
