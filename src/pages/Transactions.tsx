import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { IconBack, IconSearch } from '../components/Icons'
import { TxGroups } from '../components/TxRow'
import { CATEGORIES, categoryOf } from '../lib/categories'
import type { CategoryId, Transaction } from '../lib/types'
import { useData, useSession } from '../state'

export function Transactions() {
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const { store } = useSession()
  const { recent, money } = useData()
  const [all, setAll] = useState<Transaction[] | null>(null)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | 'expense' | 'income'>('all')
  const cat = params.get('cat') as CategoryId | null

  // Reload whenever shared data refreshes (adds, edits, deletes elsewhere).
  useEffect(() => {
    store.listTransactions().then(setAll).catch(() => setAll([]))
  }, [store, recent])

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (all ?? []).filter(
      (t) =>
        (filter === 'all' || t.kind === filter) &&
        (!cat || t.category === cat) &&
        (!needle ||
          t.title.toLowerCase().includes(needle) ||
          (t.note ?? '').toLowerCase().includes(needle) ||
          categoryOf(t.category).label.toLowerCase().includes(needle) ||
          String(t.amount).includes(needle)),
    )
  }, [all, q, filter, cat])

  const total = list.reduce((s, t) => s + (t.kind === 'income' ? t.amount : -t.amount), 0)

  return (
    <main className="page">
      <header className="bar-head">
        <button className="icon-btn" onClick={() => nav(-1)} aria-label="Back">
          <IconBack />
        </button>
        <h1>Activity</h1>
        <span className="icon-btn-spacer" />
      </header>
      <label className="search">
        <IconSearch size={18} />
        <input id="search" placeholder="Search name, note, amount" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      <div className="filter-row">
        {(['all', 'expense', 'income'] as const).map((f) => (
          <button key={f} className={`chip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f === 'expense' ? 'Spent' : 'Received'}
          </button>
        ))}
        {cat && CATEGORIES[cat] && (
          <button className="chip on" onClick={() => setParams({})} aria-label={`Remove ${CATEGORIES[cat].label} filter`}>
            {CATEGORIES[cat].emoji} {CATEGORIES[cat].label} ✕
          </button>
        )}
      </div>
      {all && list.length > 0 && (
        <p className="list-total">
          {list.length} {list.length === 1 ? 'transaction' : 'transactions'} · net <b className="num amt">{money(total, { sign: true })}</b>
        </p>
      )}
      {all === null && <p className="muted center">Loading…</p>}
      {all && list.length === 0 && <p className="muted center pad">No transactions match. Try a different search or filter.</p>}
      <TxGroups list={list} />
    </main>
  )
}
