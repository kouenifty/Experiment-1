import { useEffect, useState, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { IconDownload } from '../components/Icons'
import { categoryOf } from '../lib/categories'
import { useData, useSession } from '../state'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'SGD', 'INR', 'IDR', 'BRL', 'MXN']

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
}

export function Settings() {
  const { store, mode, email, signOut } = useSession()
  const { profile, refresh } = useData()
  const loc = useLocation()
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [last4, setLast4] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (!profile) return
    setName(profile.full_name)
    setCurrency(profile.currency)
    setLast4(profile.card_last4)
  }, [profile])

  useEffect(() => {
    const h = (e: Event) => {
      e.preventDefault()
      setInstallEvt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', h)
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])

  useEffect(() => {
    if (loc.hash) document.getElementById(loc.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
  }, [loc.hash])

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!/^\d{4}$/.test(last4)) return setMsg('Card digits must be 4 numbers')
    setBusy(true)
    try {
      await store.updateProfile({ full_name: name.trim(), currency, card_last4: last4 })
      await refresh()
      setMsg('Saved')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  async function exportCsv() {
    const rows = await store.listTransactions()
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`
    const csv = [
      'date,title,kind,category,amount,note',
      ...rows.map((t) => [t.occurred_at, esc(t.title), t.kind, esc(categoryOf(t.category).label), t.amount.toFixed(2), esc(t.note ?? '')].join(',')),
    ].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `pocket-transactions-${new Date().toISOString().slice(0, 10)}.csv` })
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="page">
      <header className="bar-head">
        <span className="icon-btn-spacer" />
        <h1>Settings</h1>
        <span className="icon-btn-spacer" />
      </header>

      <div className="profile-card">
        <Avatar name={name || 'You'} tint="mint" size={56} />
        <div>
          <strong>{profile?.full_name || '—'}</strong>
          <span className="muted">{mode === 'demo' ? 'Demo mode · saved on this device' : email}</span>
        </div>
      </div>

      <form className="form card-section" onSubmit={save}>
        <h3>Profile</h3>
        <label className="field">
          <span>Display name</span>
          <input value={name} onChange={(e) => (setName(e.target.value), setMsg(null))} maxLength={60} />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Currency</span>
            <select value={currency} onChange={(e) => (setCurrency(e.target.value), setMsg(null))}>
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Card last 4</span>
            <input className="num" inputMode="numeric" maxLength={4} value={last4} onChange={(e) => (setLast4(e.target.value.replace(/\D/g, '')), setMsg(null))} />
          </label>
        </div>
        {msg && <p className={msg === 'Saved' ? 'form-ok' : 'form-error'}>{msg}</p>}
        <button className="btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <section className="card-section" id="data">
        <h3>Data</h3>
        <button className="row-btn" onClick={exportCsv}>
          <IconDownload size={20} /> Export transactions (CSV)
        </button>
        {installEvt && (
          <button className="row-btn" onClick={() => installEvt.prompt().then(() => setInstallEvt(null))}>
            <IconDownload size={20} /> Install Pocket on this device
          </button>
        )}
      </section>

      <button
        className="btn-danger"
        onClick={() => {
          if (mode === 'supabase' || confirm('Reset demo data? Everything stored on this device will be replaced with sample data.')) void signOut()
        }}
      >
        {mode === 'demo' ? 'Reset demo data' : 'Sign out'}
      </button>
      <p className="muted center tiny">Pocket v0.1 · {mode === 'demo' ? 'Local demo' : 'Synced with Supabase'}</p>
    </main>
  )
}
