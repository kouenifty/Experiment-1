import { NavLink } from 'react-router-dom'
import { IconChart, IconChat, IconGear, IconHome } from './Icons'

const TABS = [
  { to: '/', label: 'Home', Icon: IconHome, fill: true },
  { to: '/analytics', label: 'Analytics', Icon: IconChart },
  { to: '/support', label: 'Support', Icon: IconChat, fill: true },
  { to: '/settings', label: 'Settings', Icon: IconGear },
]

export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map(({ to, label, Icon, fill }) => (
        <NavLink key={to} to={to} end className={({ isActive }) => `tab ${isActive ? 'active' : ''} ${fill ? 'fillable' : ''}`}>
          <Icon size={24} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
