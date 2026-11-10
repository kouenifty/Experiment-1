import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Transaction, TxKind } from './lib/types'

// ── Local preferences (per device) ──────────────────────────────────────────
export type Appearance = 'system' | 'light' | 'dark'

function readPref<T extends string>(key: string, fallback: T): T {
  try {
    return (localStorage.getItem(key) as T) || fallback
  } catch {
    return fallback
  }
}
function writePref(key: string, v: string) {
  try {
    localStorage.setItem(key, v)
  } catch {
    /* ignore */
  }
}

// ── Toasts ──────────────────────────────────────────────────────────────────
interface Toast {
  id: number
  text: string
  undo?: () => void | Promise<void>
}

// ── Entry sheet (add / edit a transaction) ──────────────────────────────────
export type EntryRequest = { kind?: TxKind; tx?: Transaction }

interface UI {
  toast(text: string, undo?: Toast['undo']): void
  openEntry(req?: EntryRequest): void
  entry: EntryRequest | null
  closeEntry(): void
  privateMode: boolean
  togglePrivate(): void
  appearance: Appearance
  setAppearance(a: Appearance): void
}

const UICtx = createContext<UI | null>(null)
export function useUI() {
  const v = useContext(UICtx)
  if (!v) throw new Error('useUI outside provider')
  return v
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [entry, setEntry] = useState<EntryRequest | null>(null)
  const [privateMode, setPrivate] = useState(() => readPref<string>('duit.private', '0') === '1')
  const [appearance, setAppearanceState] = useState<Appearance>(() => readPref<Appearance>('duit.appearance', 'system'))
  const seq = useRef(0)

  useEffect(() => {
    const el = document.documentElement
    if (privateMode) el.setAttribute('data-private', '')
    else el.removeAttribute('data-private')
  }, [privateMode])

  useEffect(() => {
    // Our own attribute, so a host page's data-theme isn't overwritten.
    document.documentElement.setAttribute('data-appearance', appearance)
    const dark =
      appearance === 'dark' ||
      (appearance === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#121117' : '#f7f5fc')
  }, [appearance])

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const toast = useCallback(
    (text: string, undo?: Toast['undo']) => {
      const id = ++seq.current
      setToasts((t) => [...t.slice(-2), { id, text, undo }])
      setTimeout(() => dismiss(id), undo ? 6000 : 3200)
    },
    [dismiss],
  )

  const value = useMemo<UI>(
    () => ({
      toast,
      entry,
      openEntry: (req = {}) => setEntry(req),
      closeEntry: () => setEntry(null),
      privateMode,
      togglePrivate: () =>
        setPrivate((p) => {
          writePref('duit.private', p ? '0' : '1')
          return !p
        }),
      appearance,
      setAppearance: (a) => {
        writePref('duit.appearance', a)
        setAppearanceState(a)
      },
    }),
    [toast, entry, privateMode, appearance],
  )

  return (
    <UICtx.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <span>{t.text}</span>
            {t.undo && (
              <button
                onClick={async () => {
                  dismiss(t.id)
                  await t.undo!()
                }}
              >
                Undo
              </button>
            )}
          </div>
        ))}
      </div>
    </UICtx.Provider>
  )
}

/** Remembers the last category used per kind, so repeat entries are one tap shorter. */
export const lastCategory = {
  get: (kind: TxKind) => readPref(`duit.lastcat.${kind}`, kind === 'income' ? 'salary' : 'food'),
  set: (kind: TxKind, cat: string) => writePref(`duit.lastcat.${kind}`, cat),
}
