import { useData } from '../state'

/** Swipeable card stack — the neighbour cards peek out like the reference's blob edges. */
export function BalanceCards() {
  const { summary, money, profile, loading } = useData()
  const month = new Date().toLocaleDateString(undefined, { month: 'long' })
  const cards = [
    { key: 'bal', tint: 'card-green', label: 'Balance', value: summary.balance, foot: `•${profile?.card_last4 ?? '0000'}` },
    { key: 'out', tint: 'card-lilac', label: `Spent in ${month}`, value: summary.monthExpense, foot: 'Expenses' },
    { key: 'in', tint: 'card-peach', label: `Earned in ${month}`, value: summary.monthIncome, foot: 'Income' },
  ]
  return (
    <div className="cards" aria-label="Account overview">
      {cards.map((c) => (
        <article key={c.key} className={`card ${c.tint}`}>
          <div className="card-top">
            <span className="card-label">{c.label}</span>
            {c.key === 'bal' && <span className="card-chip">POCKET</span>}
          </div>
          <div className="card-bottom">
            <strong className={`card-value num ${loading && !profile ? 'skeleton' : ''}`}>{money(c.value)}</strong>
            <span className="card-foot num">{c.foot}</span>
          </div>
        </article>
      ))}
    </div>
  )
}
