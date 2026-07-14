import { NavLink } from 'react-router-dom'
import { BarChart3, CalendarDays, LayoutDashboard, Map, Settings } from 'lucide-react'
import Logo from '../ui/Logo.jsx'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/canvas', label: 'Canvas', icon: Map },
  { to: '/planner', label: 'Planner', icon: CalendarDays },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function AppNav() {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-border-subtle bg-bg-surface/95 p-2 surface-shadow backdrop-blur-xl lg:sticky lg:top-0 lg:inset-auto lg:flex lg:h-screen lg:w-64 lg:flex-col lg:overflow-y-auto lg:rounded-none lg:border-x-0 lg:border-y-0 lg:border-r lg:bg-bg-surface">
      <div className="hidden px-4 py-5 lg:block">
        <Logo />
      </div>
      <div className="grid grid-cols-5 gap-1 lg:mt-4 lg:flex lg:flex-col lg:px-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-signal lg:flex-row lg:gap-3 lg:px-4 lg:py-3 lg:text-sm ${
                isActive ? 'bg-accent-signal text-text-primary' : 'text-text-secondary hover:bg-bg-surface-hi hover:text-text-primary'
              }`
            }
          >
            <Icon size={19} />
            <span className="max-w-full truncate">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
