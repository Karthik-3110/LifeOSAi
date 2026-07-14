import { useState } from 'react'
import { ShieldCheck, Trash2 } from 'lucide-react'
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
      await refreshUser()
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">Settings</h1>
      <p className="mt-2 text-text-secondary">Manage your account, access, billing, and theme.</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        <SettingsTabs active={active} onChange={setActive} />
        {active === 'Account' ? (
          <ProfileForm error={error} onSave={saveProfile} saving={saving} user={user} />
        ) : active === 'Billing' ? (
          <BillingPanel />
        ) : active === 'Security' ? (
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-semibold text-text-primary">Security</h2>
                <p className="mt-2 text-text-secondary">Refresh your authenticated session and synced account profile.</p>
              </div>
              <ShieldCheck className="text-accent-signal" size={26} />
            </div>
            {error && <div className="mt-6 rounded-xl border border-node-deadline/30 bg-node-deadline/10 px-4 py-3 text-sm text-node-deadline">{error}</div>}
            <div className="mt-8 flex justify-end">
              <Button onClick={refreshUser}>Refresh session</Button>
            </div>
          </Card>
        ) : active === 'Theme' ? (
          <Card>
            <h2 className="font-display text-2xl font-semibold text-text-primary">Theme</h2>
            <p className="mt-2 text-text-secondary">Switch between the saved light and dark interface themes.</p>
            <div className="mt-8 flex justify-end">
              <ThemeToggle />
            </div>
          </Card>
        ) : (
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-semibold text-text-primary">Delete Account</h2>
                <p className="mt-2 text-text-secondary">Delete your LifeOS profile, goals, tasks, Brain Dumps, canvases, and AI history from MongoDB.</p>
              </div>
              <Trash2 className="text-node-deadline" size={26} />
            </div>
            {error && <div className="mt-6 rounded-xl border border-node-deadline/30 bg-node-deadline/10 px-4 py-3 text-sm text-node-deadline">{error}</div>}
            <div className="mt-8 flex justify-end">
              <Button onClick={deleteAccount} disabled={saving}>{saving ? 'Deleting...' : 'Delete account data'}</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
