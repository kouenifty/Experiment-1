export type Tint = 'peach' | 'lilac' | 'mint' | 'pink' | 'sky' | 'sun' | 'gray'
export type TxKind = 'expense' | 'income'
export type GoalIcon = 'petals' | 'hourglass' | 'stack' | 'orb' | 'spark'

export type CategoryId =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'bills'
  | 'fun'
  | 'health'
  | 'transfer'
  | 'savings'
  | 'salary'
  | 'refund'
  | 'other'

export interface Profile {
  id: string
  full_name: string
  currency: string
  card_last4: string
}

export interface Transaction {
  id: string
  title: string
  amount: number
  kind: TxKind
  category: CategoryId
  note: string | null
  occurred_at: string
}
export type NewTransaction = Omit<Transaction, 'id'>

export interface Contact {
  id: string
  name: string
  handle: string
  tint: Tint
}
export type NewContact = Omit<Contact, 'id'>

export interface Goal {
  id: string
  name: string
  target: number
  saved: number
  icon: GoalIcon
  tint: Tint
}
export type NewGoal = Omit<Goal, 'id'>

export interface Summary {
  balance: number
  monthExpense: number
  monthIncome: number
}

export interface TxQuery {
  from?: Date
  to?: Date
  limit?: number
}

/** Storage backend. Implemented by Supabase and by a local (demo) store. */
export interface Store {
  getProfile(): Promise<Profile>
  updateProfile(patch: Partial<Omit<Profile, 'id'>>): Promise<Profile>
  summary(): Promise<Summary>
  listTransactions(q?: TxQuery): Promise<Transaction[]>
  addTransaction(t: NewTransaction): Promise<Transaction>
  deleteTransaction(id: string): Promise<void>
  listContacts(): Promise<Contact[]>
  addContact(c: NewContact): Promise<Contact>
  listGoals(): Promise<Goal[]>
  addGoal(g: NewGoal): Promise<Goal>
  updateGoal(id: string, patch: Partial<NewGoal>): Promise<Goal>
  deleteGoal(id: string): Promise<void>
}
