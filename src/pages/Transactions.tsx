import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconBack, IconSearch } from '../components/Icons'
import { TxDetailSheet } from '../components/TxDetailSheet'
import { TxRow } from '../components/TxRow'
import { categoryOf } from '../lib/categories'
import { dayLabel } from '../lib/format'
import type { Transaction } from '../lib/types'
import { useData, useSession } from '../state'

export function Transactions() {
  const nav = useNavigate()
  const { store } = useSession()
  const { recent } = useData()
  const [all, setAll] = useState<Transaction[] | null>(null)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | 'expense' | 'income'>('all')
  const [detail, setDetail] = useState<Transaction | null>(null)

  // Reload whenever the shared data refreshes (adds / deletes elsewhere).
  useEffect(() => {
    store.listTransactions().then(setAll).catch(() => setAll([]))
  }, [store, recent])

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = (all ?? []).filter(
      (t) =>
        (filter === 'all' || t.kind === filter) &&
        (!needle || t.title.toLowerCase().includes(needle) || categoryOf(t.category).label.toLowerCase().includes(needle)),
    )
    const out: { day: string; items: Transaction[] }[] = []
    for (const t of list) {
      const d = dayLabel(new Date(t.occurred_at))
      const last = out[out.length - 1]
      if (last && last.day === d) last.items.push(t)
      else out.push({ day: d, items: [t] })
    }
    return out
  }, [all, q, filter])

  return (
    <main className="page">
      <header className="bar-head">
        <button className="icon-btn" onClick={() => nav(-1)} aria-label="Back">
          <IconBack />
        </button>
        <h1>All transactions</h1>
        <span className="icon-btn-spacer" />
      </header>
      <label className="search">
        <IconSearch size={18} />
        <input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      <div className="segmented">
        {(['all', 'expense', 'income'] as const).map((f) => (
          <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f === 'expense' ? 'Expenses' : 'Income'}
          </button>
        ))}
      </div>
      {all === null && <p className="muted center">Loading…</p>}
      {all && groups.length === 0 && <p className="muted center">Nothing here.</p>}
      {groups.map((g) => (
        <section key={g.day} className="tx-group">
          <h3>{g.day}</h3>
          <div className="tx-list">
            {g.items.map((t) => (
              <TxRow key={t.id} tx={t} onClick={() => setDetail(t)} />
            ))}
          </div>
        </section>
      ))}
      <TxDetailSheet tx={detail} onClose={() => setDetail(null)} />
    </main>
  )
}
