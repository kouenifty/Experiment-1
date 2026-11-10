import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { ContactSheet } from '../components/ContactSheet'
import { IconBack, IconPlus, IconSend } from '../components/Icons'
import { Keypad } from '../components/Keypad'
import { currencySymbol, round2 } from '../lib/format'
import { useData, useSession } from '../state'
import { useUI } from '../ui'

export function Transfer() {
  const nav = useNavigate()
  const { store } = useSession()
  const { contacts, refresh, money, summary, currency } = useData()
  const { toast } = useUI()
  const [selected, setSelected] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const rowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!selected && contacts[0]) setSelected(contacts[0].id)
  }, [contacts, selected])

  useEffect(() => {
    rowRef.current?.querySelector('.on')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [selected])

  const contact = contacts.find((c) => c.id === selected) ?? null
  const value = Number(amount || 0)
  const tooMuch = value > summary.balance

  async function send() {
    setErr(null)
    if (!contact) return setErr('Pick someone to pay')
    if (!(value > 0)) return setErr('Enter an amount')
    if (tooMuch) return setErr(`You only have ${money(summary.balance)} available`)
    setBusy(true)
    try {
      const tx = await store.addTransaction({
        title: contact.name,
        amount: round2(value),
        kind: 'expense',
        category: 'transfer',
        note: note.trim() || `To @${contact.handle}`,
        occurred_at: new Date().toISOString(),
      })
      await refresh()
      toast(`${money(value)} sent to ${contact.name.split(' ')[0]}`, async () => {
        await store.deleteTransaction(tx.id)
        await refresh()
      })
      nav('/')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Transfer failed')
      setBusy(false)
    }
  }

  return (
    <main className="page transfer">
      <header className="bar-head">
        <button className="icon-btn" onClick={() => nav(-1)} aria-label="Back">
          <IconBack />
        </button>
        <h1>Send money</h1>
        <span className="icon-btn-spacer" />
      </header>

      <div className="people" ref={rowRef}>
        {contacts.map((c) => (
          <button key={c.id} className={`person ${c.id === selected ? 'on' : ''}`} onClick={() => setSelected(c.id)} aria-label={`Pay ${c.name}`} aria-pressed={c.id === selected}>
            {c.id === selected && <span className="person-burst" aria-hidden="true" />}
            <Avatar name={c.name} tint={c.tint} size={c.id === selected ? 72 : 50} />
          </button>
        ))}
        <button className="person add" onClick={() => setAdding(true)} aria-label="Add someone new">
          <IconPlus />
        </button>
      </div>
      <p className="handle">{contact ? <><b>{contact.name}</b> · @{contact.handle}</> : 'Add someone to pay'}</p>

      <p className={`transfer-amount num ${amount ? '' : 'placeholder'} ${tooMuch ? 'over' : ''}`} aria-live="polite">
        <span className="cur">{currencySymbol(currency)}</span>
        {amount || '0'}
      </p>
      <p className="avail">
        Available <span className="num amt">{money(summary.balance)}</span>
      </p>
      <input id="transfer-note" className="entry-input center-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What’s it for? (optional)" maxLength={120} />
      {err && <p className="form-error center">{err}</p>}

      <Keypad value={amount} onChange={setAmount} />

      <button className="btn-primary send" onClick={send} disabled={busy || !contact || !(value > 0) || tooMuch}>
        {busy ? 'Sending…' : contact && value > 0 ? `Send ${money(value)} to ${contact.name.split(' ')[0]}` : 'Send money'} <IconSend size={20} />
      </button>

      <ContactSheet open={adding} onClose={() => setAdding(false)} onAdded={(c) => setSelected(c.id)} />
    </main>
  )
}
