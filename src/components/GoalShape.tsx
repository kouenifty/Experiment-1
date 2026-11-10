import type { GoalIcon } from '../lib/types'

/** Soft abstract glyphs echoing the savings-goal marks in the reference. */
export function GoalShape({ icon, size = 30 }: { icon: GoalIcon; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 32 32', fill: 'white', 'aria-hidden': true }
  switch (icon) {
    case 'petals':
      return (
        <svg {...common}>
          <path d="M16 13.2C14 8 9.5 3.5 6 6s-.5 8 4.8 10C5.5 18 3.5 22.5 6 26s8 .5 10-4.8c2 5.3 6.5 7.3 10 4.8s1-8-4.8-10C26.5 14 28.5 9.5 26 6s-8-.5-10 7.2z" />
        </svg>
      )
    case 'hourglass':
      return (
        <svg {...common}>
          <path d="M6 4h20c0 6-5 9.5-8.2 12C21 18.5 26 22 26 28H6c0-6 5-9.5 8.2-12C11 13.5 6 10 6 4z" />
        </svg>
      )
    case 'stack':
      return (
        <svg {...common}>
          <ellipse cx="16" cy="7" rx="8" ry="4.2" />
          <path d="M6 16c0-3 4.5-4.6 10-4.6S26 13 26 16s-4.5 4.6-10 4.6S6 19 6 16z" />
          <path d="M7.5 26c0-3.3 3.8-5 8.5-5s8.5 1.7 8.5 5c0 1.6-3.8 2.6-8.5 2.6S7.5 27.6 7.5 26z" />
        </svg>
      )
    case 'orb':
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="11" />
        </svg>
      )
    case 'spark':
      return (
        <svg {...common}>
          <path d="M16 3c1.2 7.5 5.5 11.8 13 13-7.5 1.2-11.8 5.5-13 13-1.2-7.5-5.5-11.8-13-13 7.5-1.2 11.8-5.5 13-13z" />
        </svg>
      )
  }
}

export const GOAL_ICONS: GoalIcon[] = ['petals', 'hourglass', 'stack', 'orb', 'spark']
