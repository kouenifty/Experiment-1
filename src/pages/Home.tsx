import { Link, useNavigate } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { BudgetCard } from '../components/BudgetCard'
import { IconArrowDownLeft, IconArrowUpRight, IconEye, IconEyeOff, IconTarget } from '../components/Icons'
import { TxGroups } from '../components/TxRow'
import { greeting } from '../lib/format'
import { useData } from '../state'
import { useUI } from '../ui'

export function Home() {
  const { profile, recent, summary, money, loading, error, refresh } = useData()
  const { privateMode, togglePrivate, openEntry } = useUI()
  const nav = useNavigate()
  const first = profile?.full_name.split(' ')[0] || 'there'

  return (
    <main className="page">
      <header className="home-head">
        <Avatar name={profile?.full_name || '?'} tint="mint" size={44} />
        <p className="welcome">
          <span>{greeting()},</span>
          <strong>{first}</strong>
        </p>
        <button className="icon-btn" onClick={togglePrivate} aria-pressed={privateMode} aria-label={privateMode ? 'Show amounts' : 'Hide amounts'}>
          {privateMode ? <IconEyeOff /> : <IconEye />}
        </button>
      </header>

      {error && (
        <div className="banner-error">
          <span>Couldn’t load your data: {error}</span>
          <button onClick={() => refresh()}>Retry</button>
        </div>
      )}

      <BudgetCard />

      <div className="stat-row">
        <div className="stat tint-mint">
          <span>Balance</span>
          <strong className={`num amt ${loading && !profile ? 'skeleton' : ''}`}>{money(summary.balance)}</strong>
        </div>
        <div className="stat tint-peach">
          <span>In this month</span>
          <strong className="num amt">{money(summary.monthIncome, { whole: true })}</strong>
        </div>
      </div>

      <div className="quick">
        <button onClick={() => nav('/transfer')}>
          <span className="quick-ico tint-lilac">
            <IconArrowUpRight size={20} />
          </span>
          Send
        </button>
        <button onClick={() => openEntry({ kind: 'income' })}>
          <span className="quick-ico tint-mint">
            <IconArrowDownLeft size={20} />
          </span>
          Income
        </button>
        <button onClick={() => nav('/goals')}>
          <span className="quick-ico tint-pink">
            <IconTarget size={20} />
          </span>
          Save
        </button>
      </div>

      <section>
        <div className="section-head">
          <h2>Recent</h2>
          {recent.length > 0 && <Link to="/transactions">See all</Link>}
        </div>
        {loading && recent.length === 0 ? (
          <div className="tx-list">
            {[0, 1, 2].map((i) => (
              <div key={i} className="tx skeleton-row" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="empty">
            <span className="empty-emoji" aria-hidden="true">
              🧾
            </span>
            <p>Nothing logged yet. Tap + to add your first expense; it takes about three seconds.</p>
            <button className="btn-ink small" onClick={() => openEntry()}>
              Add an expense
            </button>
          </div>
        ) : (
          <TxGroups list={recent.slice(0, 12)} />
        )}
      </section>
    </main>
  )
}
