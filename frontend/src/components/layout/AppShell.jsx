import { Outlet } from 'react-router-dom'
import { Bell, LogOut, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import Avatar from '../ui/Avatar.jsx'
import Logo from '../ui/Logo.jsx'
import ThemeToggle from '../ui/ThemeToggle.jsx'
import AppNav from './AppNav.jsx'

export default function AppShell() {
  const { logout, user } = useAuth()
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState('')

  const handleSearch = (event) => {
    setSearch(event.target.value)
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setNotice(search ? `Searching for "${search}"` : '')
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [search])

  return (
    <div className="min-h-screen bg-bg-base text-text-primary lg:flex">
      <AppNav />
      <div className="min-w-0 flex-1 pb-24 lg:min-h-screen lg:pb-0">
        <header className="sticky top-0 z-30 border-b border-border-subtle bg-bg-base/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <label className="hidden min-w-0 flex-1 items-center gap-3 rounded-full border border-border-subtle bg-bg-elevated px-4 py-2 text-text-muted md:flex">
              <Search size={17} />
              <input
                value={search}
                onChange={handleSearch}
                placeholder="Search goals, tasks, resources..."
                className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
              />
            </label>
            <div className="flex flex-1 items-center justify-between gap-3 md:flex-none">
              <div className="md:hidden">
                <Logo compact />
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <button
                  className="rounded-full border border-border-subtle bg-bg-elevated p-2 text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-signal"
                  aria-label="Notifications"
                  onClick={() => setNotice('No unread notifications')}
                >
                  <Bell size={18} />
                </button>
                <div className="flex items-center gap-3">
                  <Avatar name={user?.name || user?.email || 'User'} src={user?.avatarUrl || ''} />
                  <div className="hidden text-sm sm:block">
                    <p className="font-semibold text-text-primary">{user?.name || 'User'}</p>
                    <p className="text-text-muted">{user?.email || `${user?.brainDumpCredits ?? 0} credits`}</p>
                  </div>
                </div>
                <button
                  className="rounded-full border border-border-subtle bg-bg-elevated p-2 text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-signal"
                  aria-label="Logout"
                  onClick={logout}
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
          {notice && (
            <div className="border-t border-border-subtle px-4 py-2 text-xs text-text-muted sm:px-6 lg:px-8">
              {notice}
            </div>
          )}
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
