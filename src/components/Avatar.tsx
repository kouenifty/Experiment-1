import { initials } from '../lib/format'
import type { Tint } from '../lib/types'

export function Avatar({ name, tint = 'lilac', size = 44, className = '' }: { name: string; tint?: Tint; size?: number; className?: string }) {
  return (
    <span
      className={`avatar tint-${tint} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}
