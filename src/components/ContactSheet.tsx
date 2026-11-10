import { useEffect, useState, type FormEvent } from 'react'
import { TINTS } from '../lib/categories'
import type { Contact } from '../lib/types'
import { useData, useSession } from '../state'
import { Sheet } from './Sheet'

export function ContactSheet({ open, onClose, onAdded }: { open: boolean; onClose(): void; onAdded(c: Contact): void }) {
  const { store } = useSession()
  const { refresh, contacts } = useData()
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setName('')
      setHandle('')
      setErr(null)
    }
  }, [open])

  async function submit(e: FormEvent) {
    e.preventDefault()
    const h = handle.trim().replace(/^@/, '')
    if (!name.trim()) return setErr('Add a name')
    if (!/^[\w.]{2,30}$/.test(h)) return setErr('Handles use letters, numbers, dots or underscores')
    setBusy(true)
    try {
      const c = await store.addContact({ name: name.trim(), handle: h, tint: TINTS[contacts.length % TINTS.length]! })
      await refresh()
      onAdded(c)
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} title="New contact" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label className="field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} autoFocus maxLength={60} />
        </label>
        <label className="field">
          <span>Handle</span>
          <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@username" autoCapitalize="none" />
        </label>
        {err && <p className="form-error">{err}</p>}
        <button className="btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Add contact'}
        </button>
      </form>
    </Sheet>
  )
}
