import { useEffect, useState, type FormEvent } from 'react'
import { TINTS } from '../lib/categories'
import { monthsUntil, round2, toDateInput } from '../lib/format'
import type { Goal, GoalIcon, Tint } from '../lib/types'
import { useData, useSession } from '../state'
import { useUI } from '../ui'
import { ConfirmButton } from './ConfirmButton'
import { GOAL_ICONS, GoalShape } from './GoalShape'
import { IconTrash } from './Icons'
import { Sheet } from './Sheet'

const parseAmount = (s: string) => round2(parseFloat(s.replace(',', '.')))
const cleanAmount = (s: string) => s.replace(/[^\d.,]/g, '')

export function NewGoalSheet({ open, onClose }: { open: boolean; onClose(): void }) {
  const { store } = useSession()
  const { refresh, money } = useData()
  const { toast } = useUI()
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [deadline, setDeadline] = useState('')
  const [icon, setIcon] = useState<GoalIcon>('petals')
  const [tint, setTint] = useState<Tint>('lilac')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setName('')
      setTarget('')
      setDeadline('')
      setErr(null)
    }
  }, [open])

  const t = parseAmount(target)
  const perMonth = deadline && t > 0 ? t / monthsUntil(deadline) : null

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setErr('Give your goal a name')
    if (!(t > 0)) return setErr('Set a target amount above zero')
    setBusy(true)
    try {
      await store.addGoal({ name: name.trim(), target: t, saved: 0, icon, tint, deadline: deadline || null })
      await refresh()
      toast(`“${name.trim()}” goal created`)
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
          <input id="goal-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New laptop" maxLength={40} />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Target</span>
            <input id="goal-target" className="num" inputMode="decimal" value={target} onChange={(e) => setTarget(cleanAmount(e.target.value))} placeholder="0.00" />
          </label>
          <label className="field">
            <span>By (optional)</span>
            <input id="goal-deadline" type="date" min={toDateInput(new Date())} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </label>
        </div>
        {perMonth !== null && (
          <p className="hint">
            That’s about <b className="num">{money(perMonth)}</b> a month.
          </p>
        )}
        <div className="field">
          <span>Look</span>
          <div className="chips">
            {GOAL_ICONS.map((i) => (
              <button type="button" key={i} aria-label={`${i} shape`} aria-pressed={icon === i} className={`shape-pick tint-grad-${tint} ${icon === i ? 'on' : ''}`} onClick={() => setIcon(i)}>
                <GoalShape icon={i} size={22} />
              </button>
            ))}
          </div>
          <div className="chips">
            {TINTS.map((c) => (
              <button type="button" key={c} aria-label={`${c} colour`} aria-pressed={tint === c} className={`swatch tint-grad-${c} ${tint === c ? 'on' : ''}`} onClick={() => setTint(c)} />
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

const QUICK = [50, 100, 200, 500]

export function FundGoalSheet({ goal, onClose }: { goal: Goal | null; onClose(): void }) {
  const { store } = useSession()
  const { refresh, money, summary } = useData()
  const { toast } = useUI()
  const [mode, setMode] = useState<'add' | 'take'>('add')
  const [amount, setAmount] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setAmount('')
    setErr(null)
    setMode('add')
  }, [goal?.id])

  if (!goal) return null
  const g = goal
  const pct = Math.min(100, Math.round((g.saved / g.target) * 100))
  const remaining = Math.max(0, g.target - g.saved)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const v = parseAmount(amount)
    if (!(v > 0)) return setErr('Enter an amount above zero')
    if (mode === 'add' && v > summary.balance) return setErr(`You only have ${money(summary.balance)} available`)
    if (mode === 'take' && v > g.saved) return setErr(`This goal only holds ${money(g.saved)}`)
    setBusy(true)
    try {
      // Money moving in or out of a goal is recorded as a transaction, so the balance stays accurate.
      const tx = await store.addTransaction({
        title: mode === 'add' ? `Saved to ${g.name}` : `Taken from ${g.name}`,
        amount: v,
        kind: mode === 'add' ? 'expense' : 'income',
        category: mode === 'add' ? 'savings' : 'other',
        note: null,
        occurred_at: new Date().toISOString(),
      })
      const before = g.saved
      await store.updateGoal(g.id, { saved: round2(g.saved + (mode === 'add' ? v : -v)) })
      await refresh()
      toast(mode === 'add' ? `${money(v)} saved to ${g.name}` : `${money(v)} moved back to your balance`, async () => {
        await store.deleteTransaction(tx.id)
        await store.updateGoal(g.id, { saved: before })
        await refresh()
      })
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    const { id: gid, ...rest } = g
    await store.deleteGoal(gid)
    await refresh()
    onClose()
    toast(`Deleted “${g.name}”`, async () => {
      await store.addGoal(rest)
      await refresh()
    })
  }

  return (
    <Sheet open title={g.name} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <div className="goal-stats">
          <div>
            <span>Saved</span>
            <strong className="num amt">{money(g.saved, { whole: true })}</strong>
          </div>
          <div>
            <span>Target</span>
            <strong className="num">{money(g.target, { whole: true })}</strong>
          </div>
          <div>
            <span>Progress</span>
            <strong className="num">{pct}%</strong>
          </div>
        </div>
        <p className="hint">
          {remaining <= 0
            ? 'Goal reached. Nice work!'
            : g.deadline
              ? `${money(remaining)} to go. Save about ${money(remaining / monthsUntil(g.deadline))} a month to make it.`
              : `${money(remaining)} to go.`}
        </p>
        <div className="segmented">
          <button type="button" className={mode === 'add' ? 'on' : ''} onClick={() => setMode('add')}>
            Add money
          </button>
          <button type="button" className={mode === 'take' ? 'on' : ''} onClick={() => setMode('take')} disabled={g.saved <= 0}>
            Take out
          </button>
        </div>
        <div className="chips">
          {QUICK.map((q) => (
            <button type="button" key={q} className={`chip ${parseAmount(amount) === q ? 'on' : ''}`} onClick={() => setAmount(String(q))}>
              {money(q, { whole: true })}
            </button>
          ))}
          {mode === 'add' && remaining > 0 && (
            <button type="button" className="chip" onClick={() => setAmount(String(round2(remaining)))}>
              Rest
            </button>
          )}
        </div>
        <label className="field">
          <span>Amount</span>
          <input id="fund-amount" className="num" inputMode="decimal" value={amount} onChange={(e) => setAmount(cleanAmount(e.target.value))} placeholder="0.00" />
        </label>
        {err && <p className="form-error">{err}</p>}
        <button className="btn-primary" disabled={busy}>
          {busy ? 'Saving…' : mode === 'add' ? 'Add to goal' : 'Move to balance'}
        </button>
        <ConfirmButton confirmText="Tap again to delete goal" onConfirm={remove}>
          <IconTrash size={18} /> Delete goal
        </ConfirmButton>
      </form>
    </Sheet>
  )
}
