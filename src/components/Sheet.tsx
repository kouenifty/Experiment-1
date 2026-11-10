import { useEffect, useId, type ReactNode } from 'react'
import { IconClose } from './Icons'

export function Sheet({ open, title, onClose, children }: { open: boolean; title: string; onClose(): void; children: ReactNode }) {
  const id = useId()
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby={id} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        <header className="sheet-head">
          <h2 id={id}>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <IconClose />
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}
