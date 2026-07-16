import { useState } from 'react'
import { Info, ShieldCheck, Trash2 } from 'lucide-react'
import Card from '../components/ui/Card.jsx'
import ProfileForm from '../components/settings/ProfileForm.jsx'
import SettingsTabs from '../components/settings/SettingsTabs.jsx'
import BillingPanel from '../components/settings/BillingPanel.jsx'
import ThemeToggle from '../components/ui/ThemeToggle.jsx'
import Button from '../components/ui/Button.jsx'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'

export default function Settings() {
  const [active, setActive] = useState('Account')
  const { logout, refreshUser, setUser, user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const saveProfile = async (body) => {
    setSaving(true)
    setError('')
    try {
      const updated = await api.updateMe(body)
      setUser(updated)
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setSaving(false)
    }
  }

  const deleteAccount = async () => {
    if (!window.confirm('Delete your LifeOS account data?')) return
    setSaving(true)
    setError('')
    try {
      await api.deleteMe()
      await logout()
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setSaving(false)
    }
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ user, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'lifeos-account-export.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">Settings</h1>
      <p className="mt-2 text-text-secondary">Manage your account, appearance, credits, billing, privacy, and support.</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        <SettingsTabs active={active} onChange={setActive} />
        {active === 'Account' ? (
          <ProfileForm error={error} onSave={saveProfile} saving={saving} user={user} />
        ) : active === 'Appearance' ? (
          <Card>
            <h2 className="font-display text-2xl font-semibold text-text-primary">Appearance</h2>
            <p className="mt-2 text-text-secondary">Switch between the saved light and dark interface themes.</p>
            <div className="mt-8 flex justify-end">
              <ThemeToggle />
            </div>
          </Card>
        ) : active === 'Security' ? (
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-semibold text-text-primary">Security</h2>
                <p className="mt-2 text-text-secondary">Refresh your session, review Google account access, or sign out everywhere.</p>
              </div>
              <ShieldCheck className="text-accent-signal" size={26} />
            </div>
            {error && <div className="mt-6 rounded-xl border border-node-deadline/30 bg-node-deadline/10 px-4 py-3 text-sm text-node-deadline">{error}</div>}
            <div className="mt-8 flex flex-wrap justify-end gap-3">
              <Button variant="secondary" onClick={logout}>Logout everywhere</Button>
              <Button onClick={refreshUser}>Refresh session</Button>
            </div>
          </Card>
        ) : active === 'Brain Dump' ? (
          <Card>
            <h2 className="font-display text-2xl font-semibold text-text-primary">Brain Dump</h2>
            <p className="mt-2 text-text-secondary">Track the credits that power automatic planner, goal, and canvas generation.</p>
            <div className="mt-8 rounded-xl border border-border-subtle bg-bg-base p-5">
              <p className="text-sm text-text-secondary">Credits Remaining</p>
              <p className="mt-2 font-display text-4xl font-bold text-accent-signal">{user?.brainDumpCredits ?? 0}</p>
            </div>
          </Card>
        ) : active === 'Billing' ? (
          <BillingPanel />
        ) : active === 'Privacy' ? (
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-semibold text-text-primary">Privacy</h2>
                <p className="mt-2 text-text-secondary">Export account data or permanently delete your LifeOS profile and generated content.</p>
              </div>
              <Trash2 className="text-node-deadline" size={26} />
            </div>
            {error && <div className="mt-6 rounded-xl border border-node-deadline/30 bg-node-deadline/10 px-4 py-3 text-sm text-node-deadline">{error}</div>}
            <div className="mt-8 flex flex-wrap justify-end gap-3">
              <Button variant="secondary" onClick={exportData}>Export data</Button>
              <Button onClick={deleteAccount} disabled={saving}>{saving ? 'Deleting...' : 'Delete account'}</Button>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-semibold text-text-primary">About</h2>
                <p className="mt-2 text-text-secondary">LifeOS AI for students. Version 1.0. Support and feedback are handled from this workspace build.</p>
              </div>
              <Info className="text-accent-signal" size={26} />
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border-subtle bg-bg-base p-4">
                <p className="text-sm text-text-secondary">Version</p>
                <p className="mt-2 font-semibold text-text-primary">1.0</p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-bg-base p-4">
                <p className="text-sm text-text-secondary">Support</p>
                <p className="mt-2 font-semibold text-text-primary">LifeOS AI</p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-bg-base p-4">
                <p className="text-sm text-text-secondary">Feedback</p>
                <p className="mt-2 font-semibold text-text-primary">Student OS build</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
