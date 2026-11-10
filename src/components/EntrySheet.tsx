import { useEffect, useMemo, useState } from 'react'
import { CATEGORIES, categoriesFor, categoryOf } from '../lib/categories'
import { addDays, currencySymbol, round2, toDateInput } from '../lib/format'
import type { CategoryId, TxKind } from '../lib/types'
import { useData, useSession } from '../state'
import { lastCategory, useUI } from '../ui'
import { ConfirmButton } from './ConfirmButton'
import { IconTrash } from './Icons'
import { Keypad } from './Keypad'
import { Sheet } from './Sheet'

/** Fast entry: amount on a keypad, one tap for category, smart defaults for the rest. */
export function EntrySheet() {
  const { entry, closeEntry, toast } = useUI()
  const { store } = useSession()
  const { refresh, money, currency } = useData()
  const editing = entry?.tx ?? null

  const [kind, setKind] = useState<TxKind>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<CategoryId>('food')
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(toDateInput(new Date()))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!entry) return
    setErr(null)
    if (entry.tx) {
      const t = entry.tx
      setKind(t.kind)
      setAmount(String(t.amount))
      setCategory(t.category)
      setTitle(t.title)
      setNote(t.note ?? '')
      setDate(toDateInput(new Date(t.occurred_at)))
    } else {
      const k = entry.kind ?? 'expense'
      setKind(k)
      setAmount('')
      setCategory(lastCategory.get(k) as CategoryId)
      setTitle('')
      setNote('')
      setDate(toDateInput(new Date()))
    }
  }, [entry])

  const switchKind = (k: TxKind) => {
    setKind(k)
    if (!CATEGORIES[category].kinds.includes(k)) setCategory(lastCategory.get(k) as CategoryId)
  }

  const today = toDateInput(new Date())
  const yesterday = toDateInput(addDays(new Date(), -1))
  const value = Number(amount || 0)
  const cats = useMemo(() => categoriesFor(kind), [kind])

  function occurredAt() {
    // Keep the original time when editing on the same day; otherwise use the current time of day.
    const base = editing && toDateInput(new Date(editing.occurred_at)) === date ? new Date(editing.occurred_at) : new Date()
    const [y, m, d] = date.split('-').map(Number)
    const out = new Date(base)
    out.setFullYear(y!, m! - 1, d!)
    return out.toISOString()
  }

  async function save() {
    if (!(value > 0)) return setErr('Enter an amount first')
    setBusy(true)
    setErr(null)
    const row = {
      kind,
      amount: round2(value),
      category,
      title: title.trim() || categoryOf(category).label,
      note: note.trim() || null,
      occurred_at: occurredAt(),
    }
    try {
      if (editing) {
        await store.updateTransaction(editing.id, row)
        toast('Changes saved')
      } else {
        const created = await store.addTransaction(row)
        lastCategory.set(kind, category)
        toast(`${kind === 'income' ? 'Income' : 'Expense'} of ${money(row.amount)} added`, async () => {
          await store.deleteTransaction(created.id)
          await refresh()
        })
      }
      closeEntry()
      await refresh()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!editing) return
    const { title: t0, amount: a0, kind: k0, category: c0, note: n0, occurred_at: o0 } = editing
    const rest = { title: t0, amount: a0, kind: k0, category: c0, note: n0, occurred_at: o0 }
    await store.deleteTransaction(editing.id)
    closeEntry()
    await refresh()
    toast(`Deleted “${editing.title}”`, async () => {
      await store.addTransaction(rest)
      await refresh()
    })
  }

  const label = kind === 'income' ? 'income' : 'expense'

  return (
    <Sheet open={!!entry} title={editing ? `Edit ${label}` : `New ${label}`} onClose={closeEntry}>
      <div className="entry">
        <div className="segmented" role="tablist" aria-label="Type">
          {(['expense', 'income'] as const).map((k) => (
            <button type="button" role="tab" aria-selected={kind === k} key={k} className={kind === k ? 'on' : ''} onClick={() => switchKind(k)}>
              {k === 'expense' ? 'Expense' : 'Income'}
            </button>
          ))}
        </div>

        <p className={`entry-amount num ${amount ? '' : 'placeholder'} ${kind}`} aria-live="polite">
          <span className="cur">{currencySymbol(currency)}</span>
          {amount || '0'}
          <span className="caret" aria-hidden="true" />
        </p>

        <div className="cat-scroll" role="radiogroup" aria-label="Category">
          {cats.map((id) => (
            <button
              type="button"
              role="radio"
              aria-checked={category === id}
              key={id}
              className={`cat ${category === id ? 'on' : ''}`}
              onClick={() => setCategory(id)}
            >
              <span className={`cat-emoji tint-${CATEGORIES[id].tint}`}>{CATEGORIES[id].emoji}</span>
              <span>{CATEGORIES[id].label}</span>
            </button>
          ))}
        </div>

        <div className="entry-fields">
          <input
            id="entry-title"
            className="entry-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`Name (${categoryOf(category).label})`}
            maxLength={80}
            aria-label="Name"
          />
          <input id="entry-note" className="entry-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" maxLength={200} aria-label="Note" />
        </div>

        <div className="date-chips" role="radiogroup" aria-label="Date">
          <button type="button" role="radio" aria-checked={date === today} className={date === today ? 'on' : ''} onClick={() => setDate(today)}>
            Today
          </button>
          <button type="button" role="radio" aria-checked={date === yesterday} className={date === yesterday ? 'on' : ''} onClick={() => setDate(yesterday)}>
            Yesterday
          </button>
          <label className={`date-pick ${date !== today && date !== yesterday ? 'on' : ''}`}>
            <input id="entry-date" type="date" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Pick a date" />
          </label>
        </div>

        <Keypad value={amount} onChange={setAmount} compact />

        {err && <p className="form-error center">{err}</p>}
        <button className="btn-primary" onClick={save} disabled={busy}>
          {busy ? 'Saving…' : editing ? 'Save changes' : value > 0 ? `Add ${money(value)} ${label}` : `Add ${label}`}
        </button>
        {editing && (
          <ConfirmButton confirmText="Tap again to delete" onConfirm={remove}>
            <IconTrash size={18} /> Delete
          </ConfirmButton>
        )}
      </div>
    </Sheet>
  )
}
