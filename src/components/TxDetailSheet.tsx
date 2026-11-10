import { useState } from 'react'
import { categoryOf } from '../lib/categories'
import { whenLabel } from '../lib/format'
import type { Transaction } from '../lib/types'
import { useData, useSession } from '../state'
import { IconTrash } from './Icons'
import { Sheet } from './Sheet'

export function TxDetailSheet({ tx, onClose, onDeleted }: { tx: Transaction | null; onClose(): void; onDeleted?(): void }) {
  const { store } = useSession()
  const { refresh, money } = useData()
  const [busy, setBusy] = useState(false)
  if (!tx) return null
  const cat = categoryOf(tx.category)

  async function remove() {
    if (!tx || !confirm(`Delete “${tx.title}”?`)) return
    setBusy(true)
    try {
      await store.deleteTransaction(tx.id)
      await refresh()
      onDeleted?.()
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open title={tx.title} onClose={onClose}>
      <div className={`detail-hero tint-${cat.tint}`}>
        <span className="num detail-amount">{money(tx.kind === 'income' ? tx.amount : -tx.amount, { sign: true })}</span>
        <span>{whenLabel(tx.occurred_at)}</span>
      </div>
      <dl className="detail-list">
        <div>
          <dt>Type</dt>
          <dd>{tx.kind === 'income' ? 'Income' : 'Expense'}</dd>
        </div>
        <div>
          <dt>Category</dt>
          <dd>{cat.label}</dd>
        </div>
        {tx.note && (
          <div>
            <dt>Note</dt>
            <dd>{tx.note}</dd>
          </div>
        )}
      </dl>
      <button className="btn-danger" onClick={remove} disabled={busy}>
        <IconTrash size={18} /> Delete transaction
      </button>
    </Sheet>
  )
}
