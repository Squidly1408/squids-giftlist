import { useState, type FormEvent } from 'react'
import { updateProfile } from 'firebase/auth'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Avatar } from '../components/ui/Avatar'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { updateUserProfile } from '../lib/firestore'

export function AccountPage() {
  const { user } = useAuth()
  const { notify } = useToast()
  const [name, setName] = useState(user?.displayName ?? '')
  const [saving, setSaving] = useState(false)

  if (!user) return null

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProfile(user!, { displayName: name })
      await updateUserProfile(user!.uid, { displayName: name })
      notify('Profile updated')
    } catch {
      notify('Could not update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-white">Account settings</h1>

      <div className="mb-8 flex items-center gap-4">
        <Avatar name={user.displayName ?? user.email ?? 'User'} photoURL={user.photoURL} size="lg" />
        <div>
          <p className="font-medium text-slate-800 dark:text-slate-100">{user.displayName}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
          {!user.photoURL && (
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
              Sign in with Google to use your Google account photo here.
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <Input label="Display name" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" loading={saving} className="w-fit">
          Save changes
        </Button>
      </form>
    </div>
  )
}
