import type { SupabaseClient } from '@supabase/supabase-js'
import { summarize } from './budget'
import { startOfMonth } from './format'
import type { Contact, Goal, Profile, Store, Transaction } from './types'

const num = (v: unknown) => (typeof v === 'number' ? v : Number(v ?? 0))

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data
}

/** For .single() calls: the row, or an error if nothing came back. */
function one<T>(res: { data: T | null; error: { message: string } | null }): T {
  const d = check(res)
  if (d == null) throw new Error('Not found')
  return d
}

type Row = Record<string, unknown>
const toTx = (r: Row): Transaction => ({ ...(r as unknown as Transaction), amount: num(r.amount) })
const toGoal = (r: Row): Goal => ({ ...(r as unknown as Goal), target: num(r.target), saved: num(r.saved) })
const toProfile = (r: Row): Profile => ({
  ...(r as unknown as Profile),
  monthly_budget: r.monthly_budget == null ? null : num(r.monthly_budget),
})

const PROFILE_COLS = 'id,full_name,currency,monthly_budget'
const TX_COLS = 'id,title,amount,kind,category,note,occurred_at'
const GOAL_COLS = 'id,name,target,saved,icon,tint,deadline'

export function createSupabaseStore(sb: SupabaseClient, userId: string, email: string): Store {
  return {
    async getProfile() {
      const row = check(await sb.from('profiles').select(PROFILE_COLS).eq('id', userId).maybeSingle())
      if (row) return toProfile(row)
      // The sign-up trigger may not have run (e.g. schema added after sign-up), so create it here.
      return toProfile(
        one(await sb.from('profiles').upsert({ id: userId, full_name: email.split('@')[0] }).select(PROFILE_COLS).single()),
      )
    },

    async updateProfile(patch) {
      return toProfile(one(await sb.from('profiles').update(patch).eq('id', userId).select(PROFILE_COLS).single()))
    },

    async summary() {
      const [bal, month] = await Promise.all([
        sb.from('account_balance').select('balance').maybeSingle(),
        sb.from('transactions').select('amount,kind,category,occurred_at').gte('occurred_at', startOfMonth().toISOString()),
      ])
      const b = check(bal) as { balance: unknown } | null
      const rows = ((check(month) ?? []) as Row[]).map((r) => ({ ...(r as unknown as Transaction), amount: num(r.amount) }))
      return summarize(rows, num(b?.balance))
    },

    async listTransactions(q = {}) {
      let query = sb.from('transactions').select(TX_COLS).order('occurred_at', { ascending: false })
      if (q.from) query = query.gte('occurred_at', q.from.toISOString())
      if (q.to) query = query.lt('occurred_at', q.to.toISOString())
      if (q.limit) query = query.limit(q.limit)
      return ((check(await query) ?? []) as Row[]).map(toTx)
    },

    async addTransaction(t) {
      return toTx(one(await sb.from('transactions').insert(t).select(TX_COLS).single()))
    },

    async updateTransaction(id, patch) {
      return toTx(one(await sb.from('transactions').update(patch).eq('id', id).select(TX_COLS).single()))
    },

    async deleteTransaction(id) {
      check(await sb.from('transactions').delete().eq('id', id))
    },

    async listContacts() {
      return (check(await sb.from('contacts').select('id,name,handle,tint').order('created_at')) ?? []) as Contact[]
    },

    async addContact(c) {
      const res = await sb.from('contacts').insert(c).select('id,name,handle,tint').single()
      if (res.error?.code === '23505') throw new Error(`@${c.handle} is already in your contacts`)
      return check(res) as Contact
    },

    async listGoals() {
      return ((check(await sb.from('savings_goals').select(GOAL_COLS).order('created_at')) ?? []) as Row[]).map(toGoal)
    },

    async addGoal(g) {
      return toGoal(one(await sb.from('savings_goals').insert(g).select(GOAL_COLS).single()))
    },

    async updateGoal(id, patch) {
      return toGoal(one(await sb.from('savings_goals').update(patch).eq('id', id).select(GOAL_COLS).single()))
    },

    async deleteGoal(id) {
      check(await sb.from('savings_goals').delete().eq('id', id))
    },
  }
}
