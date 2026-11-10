import type { SupabaseClient } from '@supabase/supabase-js'
import { startOfMonth } from './format'
import type { Contact, Goal, Profile, Store, Transaction } from './types'

const num = (v: unknown) => (typeof v === 'number' ? v : Number(v ?? 0))

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data as T
}

const toTx = (r: Record<string, unknown>): Transaction => ({ ...(r as unknown as Transaction), amount: num(r.amount) })
const toGoal = (r: Record<string, unknown>): Goal => ({ ...(r as unknown as Goal), target: num(r.target), saved: num(r.saved) })

const TX_COLS = 'id,title,amount,kind,category,note,occurred_at'
const GOAL_COLS = 'id,name,target,saved,icon,tint'

export function createSupabaseStore(sb: SupabaseClient, userId: string, email: string): Store {
  return {
    async getProfile() {
      const row = check(await sb.from('profiles').select('id,full_name,currency,card_last4').eq('id', userId).maybeSingle())
      if (row) return row as Profile
      // Trigger may not have run (e.g. schema added after sign-up) — create it.
      const created = check(
        await sb
          .from('profiles')
          .upsert({ id: userId, full_name: email.split('@')[0] })
          .select('id,full_name,currency,card_last4')
          .single(),
      )
      return created as Profile
    },

    async updateProfile(patch) {
      return check(
        await sb.from('profiles').update(patch).eq('id', userId).select('id,full_name,currency,card_last4').single(),
      ) as Profile
    },

    async summary() {
      const [bal, month] = await Promise.all([
        sb.from('account_balance').select('balance').maybeSingle(),
        sb.from('transactions').select('amount,kind').gte('occurred_at', startOfMonth().toISOString()),
      ])
      const b = check(bal) as { balance: unknown } | null
      const rows = (check(month) ?? []) as { amount: unknown; kind: string }[]
      let monthExpense = 0
      let monthIncome = 0
      for (const r of rows) {
        if (r.kind === 'income') monthIncome += num(r.amount)
        else monthExpense += num(r.amount)
      }
      return { balance: num(b?.balance), monthExpense, monthIncome }
    },

    async listTransactions(q = {}) {
      let query = sb.from('transactions').select(TX_COLS).order('occurred_at', { ascending: false })
      if (q.from) query = query.gte('occurred_at', q.from.toISOString())
      if (q.to) query = query.lt('occurred_at', q.to.toISOString())
      if (q.limit) query = query.limit(q.limit)
      return (check(await query) ?? []).map((r) => toTx(r as Record<string, unknown>))
    },

    async addTransaction(t) {
      return toTx(check(await sb.from('transactions').insert(t).select(TX_COLS).single()) as Record<string, unknown>)
    },

    async deleteTransaction(id) {
      check(await sb.from('transactions').delete().eq('id', id))
    },

    async listContacts() {
      return (check(await sb.from('contacts').select('id,name,handle,tint').order('created_at')) ?? []) as Contact[]
    },

    async addContact(c) {
      return check(await sb.from('contacts').insert(c).select('id,name,handle,tint').single()) as Contact
    },

    async listGoals() {
      return (check(await sb.from('savings_goals').select(GOAL_COLS).order('created_at')) ?? []).map((r) =>
        toGoal(r as Record<string, unknown>),
      )
    },

    async addGoal(g) {
      return toGoal(check(await sb.from('savings_goals').insert(g).select(GOAL_COLS).single()) as Record<string, unknown>)
    },

    async updateGoal(id, patch) {
      return toGoal(
        check(await sb.from('savings_goals').update(patch).eq('id', id).select(GOAL_COLS).single()) as Record<string, unknown>,
      )
    },

    async deleteGoal(id) {
      check(await sb.from('savings_goals').delete().eq('id', id))
    },
  }
}
