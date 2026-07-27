import { NavLink } from 'react-router-dom'
import { BarChart3, CalendarDays, GraduationCap, LayoutDashboard, Map, Settings } from 'lucide-react'
import Logo from '../ui/Logo.jsx'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/canvas', label: 'Canvas', icon: Map },
  { to: '/planner', label: 'Planner', icon: CalendarDays },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/semester-copilot', label: 'Semester Copilot', icon: GraduationCap },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function AppNav() {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 rounded-[20px] border border-border-subtle bg-bg-surface/95 p-2 surface-shadow backdrop-blur-xl lg:sticky lg:top-4 lg:mb-4 lg:ml-4 lg:flex lg:h-[calc(100vh-2rem)] lg:w-64 lg:flex-col lg:overflow-y-auto lg:rounded-[24px] lg:border lg:bg-bg-elevated/90">
      <div className="hidden px-4 py-5 lg:block">
        <Logo />
      </div>
      <div className="grid grid-cols-6 gap-1 lg:mt-4 lg:flex lg:flex-col lg:px-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-signal lg:flex-row lg:gap-3 lg:px-4 lg:py-3 lg:text-sm ${
                isActive ? 'bg-gradient-to-r from-accent-signal to-accent-signal-hi text-white shadow-[0_8px_20px_rgba(236,78,32,0.22)]' : 'text-text-secondary hover:bg-accent-signal/10 hover:text-accent-signal'
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
