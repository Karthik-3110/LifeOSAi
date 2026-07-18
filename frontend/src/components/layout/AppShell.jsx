import { Outlet, useNavigate } from 'react-router-dom'
import { Bell, LogOut, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import { useAppData } from '../../context/useAppData.js'
import Avatar from '../ui/Avatar.jsx'
import Logo from '../ui/Logo.jsx'
import ThemeToggle from '../ui/ThemeToggle.jsx'
import AppNav from './AppNav.jsx'

export default function AppShell() {
  const { logout, user } = useAuth()
  const { cache } = useAppData()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState('')

  const results = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return []

    const matches = (value) => String(value || '').toLowerCase().includes(query)
    const rows = [
      ...(cache.goals || []).filter((item) => matches(item.title) || matches(item.category)).map((item) => ({ id: `goal-${item._id}`, label: item.title, type: 'Goal', to: '/dashboard' })),
      ...Object.values(cache.plannerWeeks || {}).flatMap((week) => week.items || []).filter((item) => matches(item.title) || matches(item.category)).map((item) => ({ id: `task-${item._id}`, label: item.title, type: 'Planner task', to: '/planner' })),
      ...(cache.brainDumps || []).filter((item) => matches(item.title)).map((item) => ({ id: `brain-dump-${item._id}`, label: item.title, type: 'Brain Dump', to: `/canvas?brainDump=${item._id}` })),
      ...Object.entries(cache.canvases || {}).flatMap(([brainDumpId, canvas]) => (canvas.nodes || []).filter((node) => matches(node.data?.label) || matches(node.data?.meta)).map((node) => ({ id: `node-${brainDumpId}-${node.id}`, label: node.data?.label || 'Canvas node', type: node.type === 'resource' ? 'Subject, note, or resource' : `Canvas ${node.type}`, to: `/canvas?brainDump=${brainDumpId}` }))),
    ]

    return rows.filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index).slice(0, 8)
  }, [cache.brainDumps, cache.canvases, cache.goals, cache.plannerWeeks, search])

  const handleSearch = (event) => {
    setSearch(event.target.value)
  }

  const openResult = (result) => {
    navigate(result.to)
    setNotice(`Opened ${result.type.toLowerCase()}: ${result.label}`)
    setSearch('')
  }

  useEffect(() => {
    if (!search) return undefined
    const timeout = window.setTimeout(() => {
      setNotice(`Searching for "${search}"`)
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [search])

  return (
    <div className="min-h-screen bg-bg-base text-text-primary lg:flex">
      <AppNav />
      <div className="min-w-0 flex-1 pb-24 lg:min-h-screen lg:pb-0">
        <header className="sticky top-0 z-30 border-b border-border-subtle bg-bg-base/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="relative hidden min-w-0 flex-1 md:block">
              <label className="flex items-center gap-3 rounded-full border border-border-subtle bg-bg-elevated px-4 py-2 text-text-muted">
                <Search size={17} />
                <input
                  value={search}
                  onChange={handleSearch}
                  placeholder="Search goals, tasks, Brain Dumps, and canvas..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
                />
              </label>
              {search && (
                <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface shadow-xl shadow-black/20">
                  {results.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-text-secondary">No matching goals, planner items, Brain Dumps, or canvas nodes.</p>
                  ) : results.map((result) => (
                    <button key={result.id} onClick={() => openResult(result)} className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-bg-surface-hi">
                      <span className="min-w-0 truncate text-sm font-semibold text-text-primary">{result.label}</span>
                      <span className="shrink-0 text-xs text-text-muted">{result.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
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
