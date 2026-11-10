import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { BalanceCards } from '../components/BalanceCards'
import { IconArrowUpRight, IconDown, IconGrid, IconPlus, IconRefresh } from '../components/Icons'
import { Sheet } from '../components/Sheet'
import { TxDetailSheet } from '../components/TxDetailSheet'
import { TxRow } from '../components/TxRow'
import { TxSheet } from '../components/TxSheet'
import type { Transaction, TxKind } from '../lib/types'
import { useData } from '../state'

export function Home() {
  const { profile, recent, refresh, loading, error } = useData()
  const nav = useNavigate()
  const [txKind, setTxKind] = useState<TxKind | null>(null)
  const [menu, setMenu] = useState(false)
  const [detail, setDetail] = useState<Transaction | null>(null)
  const name = profile?.full_name || 'there'

  return (
    <main className="page">
      <header className="home-head">
        <Avatar name={name} tint="mint" size={44} />
        <p className="welcome">
          Welcome,
          <br />
          <strong>{name}</strong>
        </p>
        <button className={`icon-btn ${loading ? 'spin' : ''}`} onClick={() => refresh()} aria-label="Refresh">
          <IconRefresh />
        </button>
      </header>

      {error && <p className="banner-error">{error}</p>}

      <BalanceCards />

      <div className="actions">
        <button className="action" onClick={() => setTxKind('income')} aria-label="Add income">
          <IconDown />
        </button>
        <button className="action" onClick={() => nav('/transfer')} aria-label="Send money">
          <IconArrowUpRight />
        </button>
        <button className="action" onClick={() => setTxKind('expense')} aria-label="Add expense">
          <IconPlus />
        </button>
        <button className="action action-main" onClick={() => setMenu(true)} aria-label="More actions">
          <IconGrid />
        </button>
      </div>

      <section>
        <div className="section-head">
          <h2>Transactions</h2>
          {recent.length > 0 && <Link to="/transactions">See all</Link>}
        </div>
        <div className="tx-list">
          {recent.slice(0, 8).map((t) => (
            <TxRow key={t.id} tx={t} onClick={() => setDetail(t)} />
          ))}
          {!loading && recent.length === 0 && (
            <div className="empty">
              <p>No transactions yet.</p>
              <button className="btn-primary small" onClick={() => setTxKind('expense')}>
                Add your first one
              </button>
            </div>
          )}
        </div>
      </section>

      <TxSheet open={txKind !== null} initialKind={txKind ?? 'expense'} onClose={() => setTxKind(null)} />
      <TxDetailSheet tx={detail} onClose={() => setDetail(null)} />
      <Sheet open={menu} title="Quick actions" onClose={() => setMenu(false)}>
        <div className="menu-grid">
          {[
            { label: 'Add expense', tint: 'peach', go: () => setTxKind('expense') },
            { label: 'Add income', tint: 'mint', go: () => setTxKind('income') },
            { label: 'Send money', tint: 'lilac', go: () => nav('/transfer') },
            { label: 'Savings goals', tint: 'sky', go: () => nav('/analytics#goals') },
            { label: 'All transactions', tint: 'pink', go: () => nav('/transactions') },
            { label: 'Export CSV', tint: 'sun', go: () => nav('/settings#data') },
          ].map((a) => (
            <button
              key={a.label}
              className={`menu-tile tint-${a.tint}`}
              onClick={() => {
                setMenu(false)
                a.go()
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      </Sheet>
    </main>
  )
}
