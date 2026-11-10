import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { TabBar } from './components/TabBar'
import { Analytics } from './pages/Analytics'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Settings } from './pages/Settings'
import { Support } from './pages/Support'
import { Transactions } from './pages/Transactions'
import { Transfer } from './pages/Transfer'
import { DataProvider, SessionProvider, useAuthBootstrap } from './state'

const TAB_ROUTES = ['/', '/analytics', '/support', '/settings']

function Shell() {
  const { pathname } = useLocation()
  return (
    <div className="shell">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/support" element={<Support />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/transfer" element={<Transfer />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {TAB_ROUTES.includes(pathname) && <TabBar />}
    </div>
  )
}

export default function App() {
  const { ready, value, key } = useAuthBootstrap()
  if (!ready) return <div className="shell splash" aria-busy="true" />
  if (!value)
    return (
      <div className="shell">
        <Login />
      </div>
    )
  return (
    <SessionProvider value={value} key={key}>
      <DataProvider>
        <Shell />
      </DataProvider>
    </SessionProvider>
  )
}
