import { Outlet } from 'react-router-dom'
import { Bell, CheckCheck, LogOut, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import { useAppData } from '../../context/useAppData.js'
import Avatar from '../ui/Avatar.jsx'
import Logo from '../ui/Logo.jsx'
import AppNav from './AppNav.jsx'

export default function AppShell() {
  const { logout, user } = useAuth()
  const { cache, markNotificationRead, markAllNotificationsRead, clearNotifications } = useAppData()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const notifications = useMemo(() => cache.notifications?.items || [], [cache.notifications])
  const unreadCount = cache.notifications?.unreadCount || 0

  useEffect(() => {
    const latest = notifications.find((item) => !item.read)
    if (!latest) return undefined
    setToast(latest)
    const timeout = window.setTimeout(() => setToast(null), 5000)
    return () => window.clearTimeout(timeout)
  }, [notifications])

  const openNotification = async (item) => {
    if (!item.read) await markNotificationRead(item._id)
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary lg:flex">
      <AppNav />
      <div className="min-w-0 flex-1 pb-24 lg:min-h-screen lg:pb-0 lg:pr-4">
        <header className="sticky top-0 z-30 mt-0 border-b border-border-subtle bg-bg-base/65 backdrop-blur-2xl lg:mt-4 lg:rounded-[20px] lg:border">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="lg:hidden"><Logo compact /></div>
            <div className="ml-auto flex items-center gap-3">
              <div className="relative">
                <button
                  className="relative rounded-full border border-node-task/20 bg-bg-elevated p-2 text-node-task shadow-[0_0_18px_rgba(1,111,185,0.12)] hover:text-node-task focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-node-task"
                  aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
                  onClick={() => setNotificationsOpen((open) => !open)}
                >
                  <Bell size={18} />
                  {unreadCount > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent-signal px-1 text-[10px] font-bold text-bg-base">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </button>
                {notificationsOpen && (
                  <div className="notification-pop absolute right-0 top-[calc(100%+0.6rem)] z-50 w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-[22px] border border-border-subtle bg-bg-surface/95 shadow-xl shadow-black/15 backdrop-blur-xl">
                    <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3"><p className="font-semibold text-text-primary">Notifications</p><div className="flex gap-1"><button onClick={() => markAllNotificationsRead()} title="Mark all read" className="rounded-lg p-1.5 text-text-muted hover:bg-bg-surface-hi hover:text-text-primary"><CheckCheck size={16} /></button><button onClick={() => clearNotifications()} title="Clear all" className="rounded-lg p-1.5 text-text-muted hover:bg-bg-surface-hi hover:text-node-deadline"><Trash2 size={16} /></button></div></div>
                    <div className="max-h-[25rem] overflow-y-auto">
                      {notifications.length === 0 ? <p className="px-4 py-8 text-center text-sm text-text-secondary">You&apos;re all caught up.</p> : notifications.map((item) => <button key={item._id} onClick={() => openNotification(item)} className={`flex w-full gap-3 border-b border-border-subtle px-4 py-3 text-left transition hover:bg-bg-surface-hi ${item.read ? 'opacity-70' : ''}`}><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.read ? 'bg-transparent' : 'bg-accent-signal'}`} /><span><span className="block text-sm font-semibold text-text-primary">{item.title}</span><span className="mt-0.5 block text-xs text-text-secondary">{item.message}</span></span></button>)}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Avatar name={user?.name || user?.email || 'User'} src={user?.avatarUrl || ''} />
                <div className="hidden text-sm sm:block"><p className="font-semibold text-text-primary">{user?.name || 'User'}</p><p className="text-text-muted">{user?.email || `${user?.brainDumpCredits ?? 0} credits`}</p></div>
              </div>
              <button className="rounded-full border border-border-subtle bg-bg-elevated p-2 text-text-secondary hover:text-accent-signal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-node-task" aria-label="Logout" onClick={logout}><LogOut size={18} /></button>
            </div>
          </div>
        </header>
        {toast && <button onClick={() => { openNotification(toast); setToast(null) }} className="notification-pop fixed right-4 top-20 z-50 flex max-w-sm items-start gap-3 rounded-[20px] border border-node-task/15 bg-bg-surface/95 px-4 py-3 text-left shadow-xl shadow-black/15 backdrop-blur-xl"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-node-task/10 text-node-task"><Bell size={16} /></span><span><span className="block text-sm font-semibold text-text-primary">{toast.title}</span><span className="block text-xs text-text-secondary">{toast.message}</span></span><X size={15} className="shrink-0 text-text-muted" /></button>}
        <main><Outlet /></main>
      </div>
    </div>
  )
}
