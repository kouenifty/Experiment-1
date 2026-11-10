import type { Session } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { money as fmtMoney } from './lib/format'
import { createLocalStore, resetLocalStore } from './lib/localStore'
import { supabase } from './lib/supabase'
import { createSupabaseStore } from './lib/supabaseStore'
import type { Contact, Goal, Profile, Store, Summary, Transaction } from './lib/types'

// ── Session ─────────────────────────────────────────────────────────────────
export type Mode = 'supabase' | 'demo'

interface SessionState {
  mode: Mode
  email: string | null
  store: Store
  signOut(): Promise<void>
}

const SessionCtx = createContext<SessionState | null>(null)

export function useSession() {
  const v = useContext(SessionCtx)
  if (!v) throw new Error('useSession outside provider')
  return v
}

/** Resolves the auth session (or demo mode). Returns null store while signed out. */
export function useAuthBootstrap() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(!supabase)
  const [demoNonce, setDemoNonce] = useState(0)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const value = useMemo<SessionState | null>(() => {
    if (!supabase) {
      return {
        mode: 'demo',
        email: null,
        store: createLocalStore(),
        async signOut() {
          resetLocalStore()
          setDemoNonce((n) => n + 1)
        },
      }
    }
    if (!session) return null
    return {
      mode: 'supabase',
      email: session.user.email ?? null,
      store: createSupabaseStore(supabase, session.user.id, session.user.email ?? ''),
      async signOut() {
        await supabase!.auth.signOut()
      },
    }
    // demoNonce forces a fresh (re-seeded) local store after reset
  }, [session?.user.id, demoNonce])

  return { ready, value, key: session?.user.id ?? `demo-${demoNonce}` }
}

export function SessionProvider({ value, children }: { value: SessionState; children: ReactNode }) {
  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>
}

// ── App data ────────────────────────────────────────────────────────────────
interface DataState {
  profile: Profile | null
  summary: Summary
  recent: Transaction[]
  goals: Goal[]
  contacts: Contact[]
  loading: boolean
  error: string | null
  refresh(): Promise<void>
  currency: string
  money(n: number, opts?: { sign?: boolean; whole?: boolean }): string
}

const DataCtx = createContext<DataState | null>(null)

export function useData() {
  const v = useContext(DataCtx)
  if (!v) throw new Error('useData outside provider')
  return v
}

const EMPTY_SUMMARY: Summary = { balance: 0, monthExpense: 0, monthIncome: 0, monthSpend: 0, todaySpend: 0 }

export function DataProvider({ children }: { children: ReactNode }) {
  const { store } = useSession()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY)
  const [recent, setRecent] = useState<Transaction[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [p, s, r, g, c] = await Promise.all([
        store.getProfile(),
        store.summary(),
        store.listTransactions({ limit: 40 }),
        store.listGoals(),
        store.listContacts(),
      ])
      setProfile(p)
      setSummary(s)
      setRecent(r)
      setGoals(g)
      setContacts(c)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [store])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Pick up changes from other devices when the app comes back into view.
  useEffect(() => {
    const onVis = () => document.visibilityState === 'visible' && void refresh()
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [refresh])

  const currency = profile?.currency ?? 'MYR'
  const money = useCallback((n: number, opts?: { sign?: boolean; whole?: boolean }) => fmtMoney(n, currency, opts), [currency])

  const value = useMemo(
    () => ({ profile, summary, recent, goals, contacts, loading, error, refresh, currency, money }),
    [profile, summary, recent, goals, contacts, loading, error, refresh, currency, money],
  )
  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>
}
