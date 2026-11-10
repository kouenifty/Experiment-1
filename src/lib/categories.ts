import type { CategoryId, Tint } from './types'

export const CATEGORIES: Record<CategoryId, { label: string; tint: Tint; kinds: ('expense' | 'income')[] }> = {
  food: { label: 'Food & grocery', tint: 'mint', kinds: ['expense'] },
  transport: { label: 'Transport', tint: 'peach', kinds: ['expense'] },
  shopping: { label: 'Shopping', tint: 'lilac', kinds: ['expense'] },
  bills: { label: 'Bills', tint: 'sky', kinds: ['expense'] },
  fun: { label: 'Fun', tint: 'pink', kinds: ['expense'] },
  health: { label: 'Health', tint: 'sun', kinds: ['expense'] },
  transfer: { label: 'Transfer', tint: 'lilac', kinds: ['expense', 'income'] },
  savings: { label: 'Savings', tint: 'sky', kinds: ['expense'] },
  salary: { label: 'Salary', tint: 'mint', kinds: ['income'] },
  refund: { label: 'Refund', tint: 'lilac', kinds: ['income'] },
  other: { label: 'Other', tint: 'gray', kinds: ['expense', 'income'] },
}

export const categoryOf = (id: string) => CATEGORIES[id as CategoryId] ?? CATEGORIES.other

export const categoriesFor = (kind: 'expense' | 'income') =>
  (Object.keys(CATEGORIES) as CategoryId[]).filter((id) => CATEGORIES[id].kinds.includes(kind))

export const TINTS: Tint[] = ['lilac', 'pink', 'sky', 'mint', 'peach', 'sun']
