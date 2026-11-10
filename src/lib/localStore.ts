import { summarize } from './budget'
import { addDays, round2, uid } from './format'
import type { CategoryId, Contact, Goal, Profile, Store, Transaction } from './types'

/** Browser-only store used when Supabase isn't configured (demo mode). */
const KEY = 'duit.demo.v2'

interface DB {
  profile: Profile
  transactions: Transaction[]
  contacts: Contact[]
  goals: Goal[]
}

/** Small deterministic PRNG so the demo looks the same on every reset. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

type Tpl = [title: string, category: CategoryId, min: number, max: number, perWeek: number, hourFrom: number, hourTo: number]
const DAILY: Tpl[] = [
  ['Grab', 'transport', 9, 26, 3, 7, 22],
  ['Mamak Bistro', 'food', 8, 19, 4, 12, 23],
  ['Tealive', 'food', 6.5, 9.9, 3, 10, 18],
  ['99 Speedmart', 'food', 18, 72, 1.5, 9, 21],
  ['Nasi lemak stall', 'food', 5, 9, 2, 7, 10],
  ['Shopee', 'shopping', 22, 149, 1, 20, 23],
  ['Touch ’n Go reload', 'transport', 50, 50, 0.7, 8, 19],
  ['Petronas', 'transport', 40, 80, 0.8, 7, 20],
  ['GSC Cinemas', 'fun', 28, 38, 0.4, 19, 22],
  ['Guardian', 'health', 15, 62, 0.4, 11, 20],
]

function seed(): DB {
  const r = rng(20261110)
  const now = new Date()
  const tx: Omit<Transaction, 'id'>[] = []
  const at = (d: Date, hFrom: number, hTo: number) => {
    const t = new Date(d)
    t.setHours(hFrom + Math.floor(r() * (hTo - hFrom)), Math.floor(r() * 60), 0, 0)
    return t
  }
  for (let back = 45; back >= 0; back--) {
    const day = addDays(now, -back)
    for (const [title, category, min, max, perWeek, hFrom, hTo] of DAILY) {
      if (r() > perWeek / 7) continue
      const when = at(day, hFrom, hTo)
      if (when > now) continue
      tx.push({ title, category, kind: 'expense', amount: round2(min + r() * (max - min)), note: null, occurred_at: when.toISOString() })
    }
    // Monthly items
    const dom = day.getDate()
    const fixed = (h: number) => {
      const d = new Date(day)
      d.setHours(h, 0, 0, 0)
      return d.toISOString()
    }
    if (dom === 3) tx.push({ title: 'TNB', category: 'bills', kind: 'expense', amount: 118.6, note: 'Electricity', occurred_at: fixed(10) })
    if (dom === 5) tx.push({ title: 'Unifi', category: 'bills', kind: 'expense', amount: 129, note: 'Home fibre', occurred_at: fixed(9) })
    if (dom === 7) tx.push({ title: 'Spotify', category: 'fun', kind: 'expense', amount: 16.9, note: null, occurred_at: fixed(8) })
    if (dom === 25) tx.push({ title: 'Salary', category: 'salary', kind: 'income', amount: 5800, note: 'Monthly salary', occurred_at: fixed(9) })
    if (dom === 25) tx.push({ title: 'Rent', category: 'bills', kind: 'expense', amount: 1400, note: null, occurred_at: fixed(12) })
  }
  tx.push({ title: 'Freelance — logo', category: 'salary', kind: 'income', amount: 650, note: 'Kedai Kopi Ah Seng', occurred_at: addDays(now, -9).toISOString() })
  tx.push({ title: 'Wei Ling', category: 'transfer', kind: 'income', amount: 45, note: 'Dinner split', occurred_at: addDays(now, -2).toISOString() })

  const net = tx.reduce((s, t) => s + (t.kind === 'income' ? t.amount : -t.amount), 0)
  tx.push({
    title: 'Opening balance',
    category: 'other',
    kind: 'income',
    amount: round2(6482.35 - net),
    note: 'Carried over',
    occurred_at: addDays(now, -46).toISOString(),
  })

  const nextYear = now.getFullYear() + 1
  return {
    profile: { id: 'demo', full_name: 'Aisyah Rahman', currency: 'MYR', monthly_budget: 2200 },
    transactions: tx.map((t) => ({ ...t, id: uid() })),
    contacts: [
      { id: uid(), name: 'Wei Ling', handle: 'weiling', tint: 'lilac' },
      { id: uid(), name: 'Arjun Kumar', handle: 'arjun.k', tint: 'mint' },
      { id: uid(), name: 'Farah Zain', handle: 'farahz', tint: 'peach' },
      { id: uid(), name: 'Daniel Tan', handle: 'danieltan', tint: 'sky' },
      { id: uid(), name: 'Mei Yee', handle: 'meiyee', tint: 'pink' },
    ],
    goals: [
      { id: uid(), name: 'Emergency fund', target: 10000, saved: 9800, icon: 'petals', tint: 'lilac', deadline: null },
      { id: uid(), name: 'Raya balik kampung', target: 1500, saved: 1170, icon: 'hourglass', tint: 'pink', deadline: `${nextYear}-03-01` },
      { id: uid(), name: 'Bali trip', target: 4000, saved: 1240, icon: 'stack', tint: 'sky', deadline: `${nextYear}-07-01` },
    ],
  }
}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as DB
  } catch {
    /* storage unavailable — fall back to a fresh seed */
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
  const db = load()
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
      const balance = db.transactions.reduce((s, t) => s + (t.kind === 'income' ? t.amount : -t.amount), 0)
      return summarize(db.transactions, balance)
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
    async updateTransaction(id, patch) {
      db.transactions = db.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t))
      commit()
      return db.transactions.find((t) => t.id === id)!
    },
    async deleteTransaction(id) {
      db.transactions = db.transactions.filter((t) => t.id !== id)
      commit()
    },
    async listContacts() {
      return db.contacts
    },
    async addContact(c) {
      if (db.contacts.some((x) => x.handle === c.handle)) throw new Error(`@${c.handle} is already in your contacts`)
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
