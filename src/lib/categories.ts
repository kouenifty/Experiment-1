import type { CategoryId, Tint, TxKind } from './types'

interface Category {
  label: string
  emoji: string
  tint: Tint
  kinds: TxKind[]
}

export const CATEGORIES: Record<CategoryId, Category> = {
  food: { label: 'Food', emoji: '🍜', tint: 'mint', kinds: ['expense'] },
  transport: { label: 'Transport', emoji: '🚗', tint: 'peach', kinds: ['expense'] },
  shopping: { label: 'Shopping', emoji: '🛍️', tint: 'lilac', kinds: ['expense'] },
  bills: { label: 'Bills', emoji: '💡', tint: 'sun', kinds: ['expense'] },
  fun: { label: 'Fun', emoji: '🎬', tint: 'pink', kinds: ['expense'] },
  health: { label: 'Health', emoji: '💊', tint: 'sky', kinds: ['expense'] },
  transfer: { label: 'Transfer', emoji: '💸', tint: 'lilac', kinds: ['expense', 'income'] },
  savings: { label: 'Savings', emoji: '🐷', tint: 'pink', kinds: ['expense'] },
  salary: { label: 'Salary', emoji: '💼', tint: 'mint', kinds: ['income'] },
  refund: { label: 'Refund', emoji: '↩️', tint: 'sky', kinds: ['income'] },
  other: { label: 'Other', emoji: '✨', tint: 'gray', kinds: ['expense', 'income'] },
}

export const categoryOf = (id: string) => CATEGORIES[id as CategoryId] ?? CATEGORIES.other

export const categoriesFor = (kind: TxKind) =>
  (Object.keys(CATEGORIES) as CategoryId[]).filter((id) => CATEGORIES[id].kinds.includes(kind))

export const TINTS: Tint[] = ['lilac', 'pink', 'sky', 'mint', 'peach', 'sun']

/** Categories whose spending doesn't count against the monthly budget. */
export const NOT_SPENDING: CategoryId[] = ['savings']
