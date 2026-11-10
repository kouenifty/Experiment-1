import { useEffect, useState, type FormEvent } from 'react'
import { categoriesFor, CATEGORIES } from '../lib/categories'
import { toLocalInput } from '../lib/format'
import type { CategoryId, TxKind } from '../lib/types'
import { useData, useSession } from '../state'
import { Sheet } from './Sheet'

export function TxSheet({ open, initialKind, onClose }: { open: boolean; initialKind: TxKind; onClose(): void }) {
  const { store } = useSession()
  const { refresh } = useData()
  const [kind, setKind] = useState<TxKind>(initialKind)
  const [amount, setAmount] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<CategoryId>(initialKind === 'income' ? 'salary' : 'food')
  const [when, setWhen] = useState(toLocalInput(new Date()))
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setKind(initialKind)
    setCategory(initialKind === 'income' ? 'salary' : 'food')
    setAmount('')
    setTitle('')
    setNote('')
    setWhen(toLocalInput(new Date()))
    setErr(null)
  }, [open, initialKind])

  const switchKind = (k: TxKind) => {
    setKind(k)
    if (!CATEGORIES[category].kinds.includes(k)) setCategory(k === 'income' ? 'salary' : 'food')
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const value = Math.round(parseFloat(amount.replace(',', '.')) * 100) / 100
    if (!(value > 0)) return setErr('Enter an amount above zero')
    if (!title.trim()) return setErr('Give it a name')
    setBusy(true)
    try {
      await store.addTransaction({
        kind,
        amount: value,
        title: title.trim(),
        category,
        note: note.trim() || null,
        occurred_at: new Date(when).toISOString(),
      })
      await refresh()
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} title={kind === 'income' ? 'Add income' : 'Add expense'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <div className="segmented" role="tablist">
          {(['expense', 'income'] as const).map((k) => (
            <button type="button" role="tab" aria-selected={kind === k} key={k} className={kind === k ? 'on' : ''} onClick={() => switchKind(k)}>
              {k === 'expense' ? 'Expense' : 'Income'}
            </button>
          ))}
        </div>
        <label className="amount-field">
          <span className="sr-only">Amount</span>
          <input
            className="num"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
            autoFocus
          />
        </label>
        <label className="field">
          <span>Name</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === 'income' ? 'e.g. Salary' : 'e.g. Grocery'} maxLength={80} />
        </label>
        <div className="field">
          <span>Category</span>
          <div className="chips">
            {categoriesFor(kind).map((id) => (
              <button type="button" key={id} className={`chip tint-${CATEGORIES[id].tint} ${category === id ? 'on' : ''}`} onClick={() => setCategory(id)}>
                {CATEGORIES[id].label}
              </button>
            ))}
          </div>
        </div>
        <label className="field">
          <span>When</span>
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} required />
        </label>
        <label className="field">
          <span>Note (optional)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
        </label>
        {err && <p className="form-error">{err}</p>}
        <button className="btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </form>
    </Sheet>
  )
}
