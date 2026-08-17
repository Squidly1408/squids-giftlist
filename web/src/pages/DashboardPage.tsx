import { useEffect, useMemo, useState } from 'react'
import { Plus, Gift, Archive } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { createList, subscribeToUserLists } from '../lib/firestore'
import type { GiftList } from '../types'
import { ListCard } from '../components/ListCard'
import { ListFormModal, type ListFormValues } from '../components/ListFormModal'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { cn } from '../utils/cn'

export function DashboardPage() {
  const { user } = useAuth()
  const { notify } = useToast()
  const [lists, setLists] = useState<GiftList[] | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    if (!user) return
    return subscribeToUserLists(user.uid, setLists)
  }, [user])

  const visible = useMemo(() => (lists ?? []).filter((l) => l.archived === showArchived), [lists, showArchived])
  const archivedCount = useMemo(() => (lists ?? []).filter((l) => l.archived).length, [lists])

  async function handleCreate(values: ListFormValues) {
    if (!user) return
    const id = await createList(user.uid, user.displayName ?? 'Someone', {
      title: values.title,
      occasion: values.occasion,
      customOccasionLabel: values.customOccasionLabel,
      description: values.description,
      eventDate: values.eventDate ? new Date(values.eventDate) : null,
      visibility: values.visibility,
    })
    notify('List created!')
    window.location.assign(`/lists/${id}`)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">My gift lists</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create a list for any occasion and share it with the people who love you.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New list
        </Button>
      </div>

      {archivedCount > 0 && (
        <div className="mb-6 flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800 w-fit">
          <button
            onClick={() => setShowArchived(false)}
            className={cn(
              'rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors',
              !showArchived ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 dark:text-slate-400'
            )}
          >
            Active
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={cn(
              'rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors',
              showArchived ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 dark:text-slate-400'
            )}
          >
            Archived ({archivedCount})
          </button>
        </div>
      )}

      {lists === null ? (
        <Spinner full />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={showArchived ? <Archive className="h-10 w-10" /> : <Gift className="h-10 w-10" />}
          title={showArchived ? 'No archived lists' : 'No lists yet'}
          description={showArchived ? undefined : 'Start your first list for Christmas, a birthday, or any occasion.'}
          action={
            !showArchived && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" /> Create your first list
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
        </div>
      )}

      <ListFormModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={handleCreate} />
    </div>
  )
}
