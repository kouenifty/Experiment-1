import { categoryOf } from '../lib/categories'
import { dayLabel, timeLabel } from '../lib/format'
import type { Transaction } from '../lib/types'
import { useData } from '../state'
import { useUI } from '../ui'

export function TxRow({ tx }: { tx: Transaction }) {
  const { money } = useData()
  const { openEntry } = useUI()
  const cat = categoryOf(tx.category)
  const income = tx.kind === 'income'
  return (
    <button className="tx" onClick={() => openEntry({ tx })}>
      <span className={`tx-icon tint-${cat.tint}`} aria-hidden="true">
        {cat.emoji}
      </span>
      <span className="tx-main">
        <span className="tx-title">{tx.title}</span>
        <span className="tx-sub">
          {cat.label} · {timeLabel(new Date(tx.occurred_at))}
          {tx.note ? ` · ${tx.note}` : ''}
        </span>
      </span>
      <span className={`tx-amount num amt ${income ? 'pos' : ''}`}>{money(income ? tx.amount : -tx.amount, { sign: true })}</span>
    </button>
  )
}

/** Transactions grouped by day, each with the day's net total. */
export function TxGroups({ list }: { list: Transaction[] }) {
  const { money } = useData()
  const groups: { day: string; items: Transaction[]; net: number }[] = []
  for (const t of list) {
    const d = dayLabel(new Date(t.occurred_at))
    let g = groups[groups.length - 1]
    if (!g || g.day !== d) groups.push((g = { day: d, items: [], net: 0 }))
    g.items.push(t)
    g.net += t.kind === 'income' ? t.amount : -t.amount
  }
  return (
    <>
      {groups.map((g) => (
        <section key={g.day} className="tx-group">
          <h3>
            <span>{g.day}</span>
            <span className="num amt">{money(g.net, { sign: true })}</span>
          </h3>
          <div className="tx-list">
            {g.items.map((t) => (
              <TxRow key={t.id} tx={t} />
            ))}
          </div>
        </section>
      ))}
    </>
  )
}
