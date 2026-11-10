import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { ContactSheet } from '../components/ContactSheet'
import { IconBack, IconBackspace, IconCheck, IconPlus, IconSend } from '../components/Icons'
import { useData, useSession } from '../state'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'] as const

function press(cur: string, k: string) {
  if (k === 'del') return cur.slice(0, -1)
  if (k === '.') return cur.includes('.') ? cur : (cur || '0') + '.'
  const [int, dec] = cur.split('.')
  if (dec !== undefined && dec.length >= 2) return cur
  if (dec === undefined && (int ?? '').length >= 7) return cur
  if (cur === '0') return k
  return cur + k
}

export function Transfer() {
  const nav = useNavigate()
  const { store } = useSession()
  const { contacts, refresh, money, summary } = useData()
  const [selected, setSelected] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const rowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!selected && contacts[0]) setSelected(contacts[0].id)
  }, [contacts, selected])

  useEffect(() => {
    rowRef.current?.querySelector('.on')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [selected])

  // Physical keyboard support on desktop.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (adding || (e.target as HTMLElement).tagName === 'INPUT') return
      if (/^[0-9.]$/.test(e.key)) setAmount((a) => press(a, e.key))
      else if (e.key === 'Backspace') setAmount((a) => press(a, 'del'))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [adding])

  const contact = contacts.find((c) => c.id === selected) ?? null
  const value = Number(amount || 0)

  async function send() {
    setErr(null)
    if (!contact) return setErr('Pick someone to pay')
    if (!(value > 0)) return setErr('Enter an amount')
    if (value > summary.balance) return setErr(`Not enough balance (${money(summary.balance)})`)
    setBusy(true)
    try {
      await store.addTransaction({
        title: contact.name,
        amount: value,
        kind: 'expense',
        category: 'transfer',
        note: `Sent to @${contact.handle}`,
        occurred_at: new Date().toISOString(),
      })
      await refresh()
      setDone(true)
      setTimeout(() => nav('/'), 1200)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Transfer failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="page transfer">
      <header className="bar-head">
        <button className="icon-btn" onClick={() => nav(-1)} aria-label="Back">
          <IconBack />
        </button>
        <h1>Transfer money</h1>
        <button className="icon-btn" onClick={() => setAdding(true)} aria-label="Add contact">
          <IconPlus />
        </button>
      </header>

      <div className="people" ref={rowRef}>
        {contacts.map((c) => (
          <button key={c.id} className={`person ${c.id === selected ? 'on' : ''}`} onClick={() => setSelected(c.id)} aria-label={`Pay ${c.name}`} aria-pressed={c.id === selected}>
            {c.id === selected && <span className="person-burst" aria-hidden="true" />}
            <Avatar name={c.name} tint={c.tint} size={c.id === selected ? 76 : 52} />
          </button>
        ))}
        <button className="person add" onClick={() => setAdding(true)} aria-label="Add contact">
          <IconPlus />
        </button>
      </div>
      <p className="handle">{contact ? `@${contact.handle}` : 'Add someone to pay'}</p>

      <p className={`transfer-amount num ${amount ? '' : 'placeholder'}`} aria-live="polite">
        {money(value)}
      </p>
      {err && <p className="form-error center">{err}</p>}

      <div className="keypad">
        {KEYS.map((k) => (
          <button key={k} className={`key ${k === '.' || k === 'del' ? 'key-flat' : ''}`} onClick={() => setAmount((a) => press(a, k))} aria-label={k === 'del' ? 'Delete' : k}>
            {k === 'del' ? <IconBackspace /> : <span className="num">{k}</span>}
          </button>
        ))}
      </div>

      <button className="btn-primary send" onClick={send} disabled={busy || done}>
        {done ? (
          <>
            Sent <IconCheck size={20} />
          </>
        ) : (
          <>
            {busy ? 'Sending…' : 'Send money'} <IconSend size={20} />
          </>
        )}
      </button>

      <ContactSheet open={adding} onClose={() => setAdding(false)} onAdded={(c) => setSelected(c.id)} />
    </main>
  )
}
