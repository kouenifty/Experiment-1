import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { EntrySheet } from './components/EntrySheet'
import { TabBar } from './components/TabBar'
import { Goals } from './pages/Goals'
import { Home } from './pages/Home'
import { Insights } from './pages/Insights'
import { Login } from './pages/Login'
import { Me } from './pages/Me'
import { Transactions } from './pages/Transactions'
import { Transfer } from './pages/Transfer'
import { DataProvider, SessionProvider, useAuthBootstrap } from './state'
import { UIProvider } from './ui'

const TAB_ROUTES = ['/', '/insights', '/goals', '/me']

function Shell() {
  const { pathname } = useLocation()
  return (
    <div className="shell">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/me" element={<Me />} />
        <Route path="/transfer" element={<Transfer />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {TAB_ROUTES.includes(pathname) && <TabBar />}
      <EntrySheet />
    </div>
  )
}

export default function App() {
  const { ready, value, key } = useAuthBootstrap()
  return (
    <UIProvider>
      {!ready ? (
        <div className="shell splash" aria-busy="true" />
      ) : !value ? (
        <div className="shell">
          <Login />
        </div>
      ) : (
        <SessionProvider value={value} key={key}>
          <DataProvider>
            <Shell />
          </DataProvider>
        </SessionProvider>
      )}
    </UIProvider>
  )
}
