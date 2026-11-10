import { categoryOf } from '../lib/categories'
import { whenLabel } from '../lib/format'
import type { Transaction } from '../lib/types'
import { useData } from '../state'

export function TxRow({ tx, onClick }: { tx: Transaction; onClick?(): void }) {
  const { money } = useData()
  const cat = categoryOf(tx.category)
  const signed = tx.kind === 'income' ? tx.amount : -tx.amount
  return (
    <button className={`tx tint-${cat.tint}`} onClick={onClick}>
      <span className="tx-main">
        <span className="tx-title">{tx.title}</span>
        <span className="tx-when">{whenLabel(tx.occurred_at)}</span>
      </span>
      <span className="tx-amount num">{money(signed, { sign: true })}</span>
    </button>
  )
}
