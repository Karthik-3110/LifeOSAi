import { useEffect, useState } from 'react'
import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'

export default function ProfileForm({ error, onSave, saving, user }) {
  const [form, setForm] = useState({ name: '', email: '', phoneNumber: '', avatarUrl: '' })
  const [fileError, setFileError] = useState('')

  useEffect(() => {
    setForm({
      name: user?.name || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      avatarUrl: user?.avatarUrl || '',
    })
  }, [user])

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const updatePhoto = (event) => {
    const file = event.target.files?.[0]
    setFileError('')
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setFileError('Choose an image file for your profile photo.')
      return
    }
    if (file.size > 1800000) {
      setFileError('Choose an image smaller than 1.8 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setForm((current) => ({ ...current, avatarUrl: String(reader.result || '') }))
    }
    reader.onerror = () => setFileError('Could not read that image.')
    reader.readAsDataURL(file)
  }

  const resetForm = () => {
    setForm({
      name: user?.name || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      avatarUrl: user?.avatarUrl || '',
    })
  }

  const submit = (event) => {
    event.preventDefault()
    onSave({
      name: form.name,
      email: form.email,
      phoneNumber: form.phoneNumber,
      avatarUrl: form.avatarUrl,
    })
  }

  const initials = (form.name || form.email || 'U').slice(0, 2).toUpperCase()

  return (
    <Card>
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="flex md:w-56 md:flex-col md:items-center">
          {form.avatarUrl ? (
            <img src={form.avatarUrl} alt="" className="h-24 w-24 rounded-full border border-border-subtle object-cover" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-border-subtle bg-bg-base font-display text-2xl font-semibold text-accent-signal">{initials}</div>
          )}
          <div className="ml-4 min-w-0 md:ml-0 md:mt-4 md:text-center">
            <p className="truncate font-display text-xl font-semibold text-text-primary">{form.name || 'Your profile'}</p>
            <p className="truncate text-sm text-text-secondary">{form.email}</p>
          </div>
        </div>

        <form onSubmit={submit} className="min-w-0 flex-1">
          <h2 className="font-display text-2xl font-semibold text-text-primary">Account profile</h2>
          <div className="mt-6 grid gap-5">
            <label className="grid gap-2 text-sm font-medium text-text-secondary">
              Name
              <input name="name" value={form.name} onChange={updateField} className="rounded-xl border border-border-subtle bg-bg-base px-4 py-3 text-text-primary outline-none transition focus:border-accent-signal focus:ring-2 focus:ring-accent-signal/20" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-text-secondary">
              Email
              <input name="email" type="email" value={form.email} onChange={updateField} className="rounded-xl border border-border-subtle bg-bg-base px-4 py-3 text-text-primary outline-none transition focus:border-accent-signal focus:ring-2 focus:ring-accent-signal/20" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-text-secondary">
              Phone Number
              <input name="phoneNumber" value={form.phoneNumber} onChange={updateField} className="rounded-xl border border-border-subtle bg-bg-base px-4 py-3 text-text-primary outline-none transition focus:border-accent-signal focus:ring-2 focus:ring-accent-signal/20" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-text-secondary">
              Profile Photo
              <input type="file" accept="image/*" onChange={updatePhoto} className="rounded-xl border border-border-subtle bg-bg-base px-4 py-3 text-text-primary file:mr-4 file:rounded-full file:border-0 file:bg-accent-signal file:px-4 file:py-2 file:text-sm file:font-semibold file:text-text-primary outline-none transition focus:border-accent-signal focus:ring-2 focus:ring-accent-signal/20" />
            </label>
          </div>
          {(error || fileError) && <div className="mt-6 rounded-xl border border-node-deadline/30 bg-node-deadline/10 px-4 py-3 text-sm text-node-deadline">{error || fileError}</div>}
          <div className="mt-8 flex justify-end gap-3">
            <Button variant="secondary" onClick={resetForm}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
          </div>
        </form>
      </div>
    </Card>
  )
}
