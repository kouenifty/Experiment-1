import { useEffect, useState, type FormEvent } from 'react'
import { TINTS } from '../lib/categories'
import type { Goal, GoalIcon, Tint } from '../lib/types'
import { useData, useSession } from '../state'
import { GOAL_ICONS, GoalShape } from './GoalShape'
import { IconTrash } from './Icons'
import { Sheet } from './Sheet'

const parseAmount = (s: string) => Math.round(parseFloat(s.replace(',', '.')) * 100) / 100

export function NewGoalSheet({ open, onClose }: { open: boolean; onClose(): void }) {
  const { store } = useSession()
  const { refresh } = useData()
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [icon, setIcon] = useState<GoalIcon>('petals')
  const [tint, setTint] = useState<Tint>('lilac')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setName('')
      setTarget('')
      setErr(null)
    }
  }, [open])

  async function submit(e: FormEvent) {
    e.preventDefault()
    const t = parseAmount(target)
    if (!name.trim()) return setErr('Name your goal')
    if (!(t > 0)) return setErr('Set a target above zero')
    setBusy(true)
    try {
      await store.addGoal({ name: name.trim(), target: t, saved: 0, icon, tint })
      await refresh()
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} title="New savings goal" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <div className={`goal-preview tint-grad-${tint}`}>
          <GoalShape icon={icon} />
          <span>{name || 'Your goal'}</span>
        </div>
        <label className="field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New laptop" maxLength={40} autoFocus />
        </label>
        <label className="field">
          <span>Target amount</span>
          <input className="num" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value.replace(/[^\d.,]/g, ''))} placeholder="0.00" />
        </label>
        <div className="field">
          <span>Shape</span>
          <div className="chips">
            {GOAL_ICONS.map((i) => (
              <button type="button" key={i} aria-label={i} className={`shape-pick tint-grad-${tint} ${icon === i ? 'on' : ''}`} onClick={() => setIcon(i)}>
                <GoalShape icon={i} size={22} />
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <span>Colour</span>
          <div className="chips">
            {TINTS.map((t) => (
              <button type="button" key={t} aria-label={t} className={`swatch tint-grad-${t} ${tint === t ? 'on' : ''}`} onClick={() => setTint(t)} />
            ))}
          </div>
        </div>
        {err && <p className="form-error">{err}</p>}
        <button className="btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Create goal'}
        </button>
      </form>
    </Sheet>
  )
}

export function FundGoalSheet({ goal, onClose }: { goal: Goal | null; onClose(): void }) {
  const { store } = useSession()
  const { refresh, money, summary } = useData()
  const [amount, setAmount] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setAmount('')
    setErr(null)
  }, [goal?.id])

  if (!goal) return null
  const g = goal
  const pct = Math.min(100, Math.round((g.saved / g.target) * 100))
  const remaining = Math.max(0, g.target - g.saved)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const v = parseAmount(amount)
    if (!(v > 0)) return setErr('Enter an amount above zero')
    if (v > summary.balance) return setErr('That’s more than your balance')
    setBusy(true)
    try {
      // Moving money into a goal is recorded as a savings expense, so the balance stays honest.
      await store.addTransaction({
        title: `Saved to ${g.name}`,
        amount: v,
        kind: 'expense',
        category: 'savings',
        note: null,
        occurred_at: new Date().toISOString(),
      })
      await store.updateGoal(g.id, { saved: Math.round((g.saved + v) * 100) / 100 })
      await refresh()
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!confirm(`Delete the “${g.name}” goal? Money already saved stays recorded as transactions.`)) return
    await store.deleteGoal(g.id)
    await refresh()
    onClose()
  }

  return (
    <Sheet open title={g.name} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <div className="goal-stats">
          <div>
            <span>Saved</span>
            <strong className="num">{money(g.saved)}</strong>
          </div>
          <div>
            <span>Target</span>
            <strong className="num">{money(g.target)}</strong>
          </div>
          <div>
            <span>Progress</span>
            <strong className="num">{pct}%</strong>
          </div>
        </div>
        <p className="muted">{remaining > 0 ? `${money(remaining)} to go.` : 'Goal reached — nice work!'}</p>
        <label className="field">
          <span>Add to this goal</span>
          <input className="num" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))} placeholder="0.00" autoFocus />
        </label>
        {err && <p className="form-error">{err}</p>}
        <button className="btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Add money'}
        </button>
        <button type="button" className="btn-danger" onClick={remove}>
          <IconTrash size={18} /> Delete goal
        </button>
      </form>
    </Sheet>
  )
}
