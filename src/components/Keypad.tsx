import { useEffect } from 'react'
import { vibrate } from '../lib/format'
import { IconBackspace } from './Icons'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'] as const

/** Applies one key press to an amount string, keeping it a valid 2-decimal number. */
export function press(cur: string, k: string) {
  if (k === 'del') return cur.slice(0, -1)
  if (k === '.') return cur.includes('.') ? cur : (cur || '0') + '.'
  const [int, dec] = cur.split('.')
  if (dec !== undefined && dec.length >= 2) return cur
  if (dec === undefined && (int ?? '').length >= 7) return cur
  if (cur === '0') return k
  return cur + k
}

export function Keypad({ value, onChange, compact }: { value: string; onChange(v: string): void; compact?: boolean }) {
  // Physical keyboard support, ignored while typing in a text field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select') || e.metaKey || e.ctrlKey) return
      if (/^[0-9.]$/.test(e.key)) onChange(press(value, e.key))
      else if (e.key === 'Backspace') onChange(press(value, 'del'))
      else if (e.key === ',') onChange(press(value, '.'))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [value, onChange])

  return (
    <div className={`keypad ${compact ? 'compact' : ''}`}>
      {KEYS.map((k) => (
        <button
          type="button"
          key={k}
          className={`key ${k === '.' || k === 'del' ? 'key-flat' : ''}`}
          onClick={() => {
            vibrate()
            onChange(press(value, k))
          }}
          onContextMenu={(e) => {
            if (k === 'del') {
              e.preventDefault()
              onChange('')
            }
          }}
          aria-label={k === 'del' ? 'Delete digit' : k === '.' ? 'Decimal point' : k}
        >
          {k === 'del' ? <IconBackspace /> : <span className="num">{k}</span>}
        </button>
      ))}
    </div>
  )
}
