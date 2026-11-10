import { addDays, startOfMonth, uid } from './format'
import type { Contact, Goal, Profile, Store, Transaction } from './types'

/** Browser-only store used when Supabase isn't configured. */
const KEY = 'pocket.demo.v1'

interface DB {
  profile: Profile
  transactions: Transaction[]
  contacts: Contact[]
  goals: Goal[]
}

function at(daysAgo: number, h: number, m: number) {
  const d = addDays(new Date(), -daysAgo)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString()

function seed(): DB {
  const tx: Omit<Transaction, 'id'>[] = [
    { title: 'Uber', amount: 21, kind: 'expense', category: 'transport', note: null, occurred_at: minsAgo(18) },
    { title: 'Apple', amount: 14, kind: 'income', category: 'refund', note: 'App Store refund', occurred_at: minsAgo(95) },
    { title: 'Grocery', amount: 102.3, kind: 'expense', category: 'food', note: null, occurred_at: minsAgo(260) },
    { title: 'Netflix', amount: 15.49, kind: 'expense', category: 'fun', note: null, occurred_at: at(1, 20, 5) },
    { title: 'Electricity', amount: 86.2, kind: 'expense', category: 'bills', note: null, occurred_at: at(1, 11, 30) },
    { title: 'Coffee Lab', amount: 6.8, kind: 'expense', category: 'food', note: null, occurred_at: at(2, 8, 12) },
    { title: 'Zara', amount: 129.0, kind: 'expense', category: 'shopping', note: null, occurred_at: at(2, 17, 44) },
    { title: 'Pharmacy', amount: 23.15, kind: 'expense', category: 'health', note: null, occurred_at: at(3, 13, 2) },
    { title: 'Freelance', amount: 640, kind: 'income', category: 'salary', note: 'Logo project', occurred_at: at(3, 10, 0) },
    { title: 'Metro card', amount: 40, kind: 'expense', category: 'transport', note: null, occurred_at: at(4, 7, 55) },
    { title: 'Sushi Bar', amount: 58.4, kind: 'expense', category: 'food', note: null, occurred_at: at(5, 19, 30) },
    { title: 'Cinema', amount: 24, kind: 'expense', category: 'fun', note: null, occurred_at: at(6, 21, 0) },
    { title: 'Internet', amount: 49.99, kind: 'expense', category: 'bills', note: null, occurred_at: at(8, 9, 0) },
  ]
  const net = tx.reduce((s, t) => s + (t.kind === 'income' ? t.amount : -t.amount), 0)
  // Opening salary so the demo balance lands on the same figure as the mock-up.
  tx.push({
    title: 'Salary',
    amount: Math.round((8921.09 - net) * 100) / 100,
    kind: 'income',
    category: 'salary',
    note: 'Monthly salary',
    occurred_at: at(12, 9, 0),
  })
  return {
    profile: { id: 'demo', full_name: 'Alex Morgan', currency: 'USD', card_last4: '5512' },
    transactions: tx.map((t) => ({ ...t, id: uid() })),
    contacts: [
      { id: uid(), name: 'Daisie Park', handle: 'daisie09', tint: 'lilac' },
      { id: uid(), name: 'Leo Hart', handle: 'leohart', tint: 'mint' },
      { id: uid(), name: 'Mia Chen', handle: 'mia.c', tint: 'peach' },
      { id: uid(), name: 'Sam Rivera', handle: 'samr', tint: 'sky' },
      { id: uid(), name: 'Nora Blake', handle: 'nora', tint: 'pink' },
    ],
    goals: [
      { id: uid(), name: 'Emergency', target: 5000, saved: 4900, icon: 'petals', tint: 'lilac' },
      { id: uid(), name: 'Home renovation', target: 12000, saved: 9360, icon: 'hourglass', tint: 'pink' },
      { id: uid(), name: 'Travel', target: 3000, saved: 1860, icon: 'stack', tint: 'sky' },
    ],
  }
}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as DB
  } catch {
    /* storage unavailable — fall through to fresh seed */
  }
  const db = seed()
  save(db)
  return db
}

function save(db: DB) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    /* ignore */
  }
}

export function resetLocalStore() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

export function createLocalStore(): Store {
  let db = load()
  const commit = () => save(db)
  const sorted = () => [...db.transactions].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))

  return {
    async getProfile() {
      return db.profile
    },
    async updateProfile(patch) {
      db.profile = { ...db.profile, ...patch }
      commit()
      return db.profile
    },
    async summary() {
      const m = startOfMonth().toISOString()
      let balance = 0
      let monthExpense = 0
      let monthIncome = 0
      for (const t of db.transactions) {
        balance += t.kind === 'income' ? t.amount : -t.amount
        if (t.occurred_at >= m) {
          if (t.kind === 'income') monthIncome += t.amount
          else monthExpense += t.amount
        }
      }
      return { balance: Math.round(balance * 100) / 100, monthExpense, monthIncome }
    },
    async listTransactions(q = {}) {
      let list = sorted()
      if (q.from) list = list.filter((t) => new Date(t.occurred_at) >= q.from!)
      if (q.to) list = list.filter((t) => new Date(t.occurred_at) < q.to!)
      return q.limit ? list.slice(0, q.limit) : list
    },
    async addTransaction(t) {
      const row = { ...t, id: uid() }
      db.transactions.push(row)
      commit()
      return row
    },
    async deleteTransaction(id) {
      db.transactions = db.transactions.filter((t) => t.id !== id)
      commit()
    },
    async listContacts() {
      return db.contacts
    },
    async addContact(c) {
      if (db.contacts.some((x) => x.handle === c.handle)) throw new Error('That handle is already in your contacts')
      const row = { ...c, id: uid() }
      db.contacts.push(row)
      commit()
      return row
    },
    async listGoals() {
      return db.goals
    },
    async addGoal(g) {
      const row = { ...g, id: uid() }
      db.goals.push(row)
      commit()
      return row
    },
    async updateGoal(id, patch) {
      db.goals = db.goals.map((g) => (g.id === id ? { ...g, ...patch } : g))
      commit()
      return db.goals.find((g) => g.id === id)!
    },
    async deleteGoal(id) {
      db.goals = db.goals.filter((g) => g.id !== id)
      commit()
    },
  }
}
