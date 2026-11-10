import { NavLink } from 'react-router-dom'
import { useUI } from '../ui'
import { IconChart, IconHome, IconPlus, IconTarget, IconUser } from './Icons'

const LEFT = [
  { to: '/', label: 'Home', Icon: IconHome },
  { to: '/insights', label: 'Insights', Icon: IconChart },
]
const RIGHT = [
  { to: '/goals', label: 'Goals', Icon: IconTarget },
  { to: '/me', label: 'Me', Icon: IconUser },
]

function Tab({ to, label, Icon }: (typeof LEFT)[number]) {
  return (
    <NavLink to={to} end className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
      <Icon size={23} />
      <span>{label}</span>
    </NavLink>
  )
}

export function TabBar() {
  const { openEntry } = useUI()
  return (
    <nav className="tabbar" aria-label="Main">
      {LEFT.map((t) => (
        <Tab key={t.to} {...t} />
      ))}
      <button className="fab" onClick={() => openEntry()} aria-label="Add a transaction">
        <IconPlus size={26} strokeWidth={2.2} />
      </button>
      {RIGHT.map((t) => (
        <Tab key={t.to} {...t} />
      ))}
    </nav>
  )
}
