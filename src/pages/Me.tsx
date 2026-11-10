import { useEffect, useState, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { ConfirmButton } from '../components/ConfirmButton'
import { IconCopy, IconDownload } from '../components/Icons'
import { categoryOf } from '../lib/categories'
import { currencySymbol, round2 } from '../lib/format'
import { useData, useSession } from '../state'
import { useUI, type Appearance } from '../ui'

const CURRENCIES = ['MYR', 'SGD', 'IDR', 'THB', 'BND', 'USD', 'EUR', 'GBP', 'AUD', 'JPY']
const IS_EMBED = import.meta.env.MODE === 'artifact'

const FAQ = [
  ['What is “Safe to spend today”?', 'Duit takes your monthly budget, subtracts what you’ve spent before today, and spreads the rest evenly over the days left in the month. Spend less today and tomorrow’s allowance goes up.'],
  ['Does “Send” move real money?', 'No. Duit is a tracker. Sending records the payment to that person so your spending stays accurate. Pay through your bank or e-wallet as usual.'],
  ['What happens when I add money to a goal?', 'It leaves your spendable balance and the goal fills up by the same amount. It isn’t counted as spending in Insights or against your budget. You can take it out again at any time.'],
  ['Can I use Duit offline?', 'Once installed, the app opens offline. With an account, changes need a connection to sync.'],
  ['How do I install it on my phone?', 'iPhone: open Duit in Safari, tap Share, then Add to Home Screen. Android: open the browser menu and tap Install app.'],
] as const

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
}

export function Me() {
  const { store, mode, email, signOut } = useSession()
  const { profile, refresh, money } = useData()
  const { appearance, setAppearance, toast } = useUI()
  const loc = useLocation()
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('MYR')
  const [budget, setBudget] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (!profile) return
    setName(profile.full_name)
    setCurrency(profile.currency)
    setBudget(profile.monthly_budget ? String(profile.monthly_budget) : '')
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
    if (loc.hash) {
      const el = document.getElementById(loc.hash.slice(1))
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el?.querySelector('input')?.focus({ preventScroll: true })
    }
  }, [loc.hash])

  const b = budget ? round2(parseFloat(budget)) : null
  const dirty =
    !!profile && (name.trim() !== profile.full_name || currency !== profile.currency || (b ?? null) !== (profile.monthly_budget ?? null))

  async function save(e: FormEvent) {
    e.preventDefault()
    if (budget && !(b! > 0)) return setErr('Budget must be above zero, or leave it empty')
    if (!name.trim()) return setErr('Your name can’t be empty')
    setBusy(true)
    setErr(null)
    try {
      await store.updateProfile({ full_name: name.trim(), currency, monthly_budget: b })
      await refresh()
      toast('Profile saved')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  async function csv() {
    const rows = await store.listTransactions()
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`
    return [
      'date,title,type,category,amount,note',
      ...rows.map((t) => [t.occurred_at, esc(t.title), t.kind, esc(categoryOf(t.category).label), t.amount.toFixed(2), esc(t.note ?? '')].join(',')),
    ].join('\n')
  }

  async function download() {
    const url = URL.createObjectURL(new Blob([await csv()], { type: 'text/csv' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `duit-${new Date().toISOString().slice(0, 10)}.csv` })
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function copy() {
    const text = await csv()
    try {
      await navigator.clipboard.writeText(text)
      toast('Copied. Paste into Google Sheets or Excel')
    } catch {
      toast('Your browser blocked copying')
    }
  }

  return (
    <main className="page">
      <header className="bar-head">
        <span className="icon-btn-spacer" />
        <h1>Me</h1>
        <span className="icon-btn-spacer" />
      </header>

      <div className="profile-card">
        <Avatar name={profile?.full_name || '?'} tint="lilac" size={56} />
        <div>
          <strong>{profile?.full_name || '—'}</strong>
          <span>{mode === 'demo' ? 'Demo · sample data on this device' : email}</span>
        </div>
      </div>

      <form className="form card-section" onSubmit={save}>
        <h3>Profile & budget</h3>
        <label className="field">
          <span>Name</span>
          <input id="me-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="name" />
        </label>
        <div className="field-row">
          <label className="field" id="budget">
            <span>Monthly budget</span>
            <span className="input-prefix">
              <i>{currencySymbol(currency)}</i>
              <input id="me-budget" className="num" inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value.replace(/[^\d.]/g, ''))} placeholder="Not set" />
            </span>
          </label>
          <label className="field">
            <span>Currency</span>
            <select id="me-currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'MYR' ? 'MYR (RM)' : c}
                </option>
              ))}
            </select>
          </label>
        </div>
        {b && b > 0 && <p className="hint">Roughly {money(b / 30)} a day.</p>}
        {err && <p className="form-error">{err}</p>}
        <button className="btn-primary" disabled={busy || !dirty}>
          {busy ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
        </button>
      </form>

      <section className="card-section">
        <h3>Appearance</h3>
        <div className="segmented">
          {(['system', 'light', 'dark'] as Appearance[]).map((a) => (
            <button key={a} className={appearance === a ? 'on' : ''} onClick={() => setAppearance(a)}>
              {a === 'system' ? 'Auto' : a === 'light' ? 'Light' : 'Dark'}
            </button>
          ))}
        </div>
      </section>

      <section className="card-section" id="data">
        <h3>Your data</h3>
        {!IS_EMBED && (
          <button className="row-btn" onClick={download}>
            <IconDownload size={20} /> Download transactions (CSV)
          </button>
        )}
        <button className="row-btn" onClick={copy}>
          <IconCopy size={20} /> Copy transactions as CSV
        </button>
        {installEvt && (
          <button className="row-btn" onClick={() => installEvt.prompt().then(() => setInstallEvt(null))}>
            <IconDownload size={20} /> Install Duit on this device
          </button>
        )}
      </section>

      <section className="card-section">
        <h3>Help</h3>
        <div className="faq">
          {FAQ.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      {mode === 'demo' ? (
        <ConfirmButton confirmText="Tap again: replaces everything with fresh sample data" onConfirm={() => void signOut()}>
          Reset demo data
        </ConfirmButton>
      ) : (
        <button className="btn-danger" onClick={() => void signOut()}>
          Sign out
        </button>
      )}
      <p className="muted center tiny">Duit 0.2 · {mode === 'demo' ? 'Demo mode' : 'Synced with Supabase'}</p>
    </main>
  )
}
