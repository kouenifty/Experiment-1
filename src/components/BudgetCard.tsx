import { useNavigate } from 'react-router-dom'
import { allowance } from '../lib/budget'
import { monthName } from '../lib/format'
import { useData } from '../state'

/** The home hero: what you can still spend today, and how the month is pacing. */
export function BudgetCard() {
  const { profile, summary, money } = useData()
  const nav = useNavigate()
  const budget = profile?.monthly_budget ?? null

  if (!budget) {
    return (
      <article className="hero hero-empty">
        <span className="hero-label">Spent in {monthName()}</span>
        <strong className="hero-value num amt">{money(summary.monthSpend)}</strong>
        <p>Set a monthly budget and Duit will tell you how much you can spend each day.</p>
        <button className="btn-ink small" onClick={() => nav('/me#budget')}>
          Set a budget
        </button>
      </article>
    )
  }

  const a = allowance(summary, budget)
  const over = a.leftToday < 0
  const monthOver = a.remaining < 0
  const ahead = a.used > a.pace + 0.05
  const status = monthOver ? 'Over budget this month' : ahead ? 'Spending faster than planned' : 'On track'

  return (
    <article className={`hero ${over || monthOver ? 'hero-over' : ''}`}>
      <div className="hero-top">
        <span className="hero-label">{over ? 'Over today’s allowance by' : 'Safe to spend today'}</span>
        <span className={`pill ${monthOver ? 'bad' : ahead ? 'warn' : 'good'}`}>{status}</span>
      </div>
      <strong className="hero-value num amt">{money(Math.abs(a.leftToday))}</strong>
      <p className="hero-sub">
        {summary.todaySpend > 0 ? (
          <>
            Spent <span className="num amt">{money(summary.todaySpend)}</span> of <span className="num amt">{money(a.daily)}</span> today
          </>
        ) : (
          <>
            <span className="num amt">{money(a.daily)}</span> a day for the next {a.daysLeft} {a.daysLeft === 1 ? 'day' : 'days'}
          </>
        )}
      </p>
      <div
        className="meter"
        role="meter"
        aria-label="Budget used"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(a.used * 100)}
      >
        <span className="meter-fill" style={{ width: `${Math.min(100, a.used * 100)}%` }} />
        <span className="meter-pace" style={{ left: `${a.pace * 100}%` }} title="Where you'd be at an even pace" />
      </div>
      <div className="hero-foot">
        <span>
          <b className="num amt">{money(summary.monthSpend, { whole: true })}</b> of <span className="num amt">{money(budget, { whole: true })}</span>
        </span>
        <span>{monthOver ? <>over by <b className="num amt">{money(-a.remaining, { whole: true })}</b></> : <><b className="num amt">{money(a.remaining, { whole: true })}</b> left</>}</span>
      </div>
    </article>
  )
}
