import { useEffect, useState, type ReactNode } from 'react'

/** Two-tap destructive button: the first tap arms it, the second confirms. */
export function ConfirmButton({ children, confirmText, onConfirm, className = 'btn-danger' }: { children: ReactNode; confirmText: string; onConfirm(): void; className?: string }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3500)
    return () => clearTimeout(t)
  }, [armed])
  return (
    <button type="button" className={`${className} ${armed ? 'armed' : ''}`} onClick={() => (armed ? onConfirm() : setArmed(true))}>
      {armed ? confirmText : children}
    </button>
  )
}
