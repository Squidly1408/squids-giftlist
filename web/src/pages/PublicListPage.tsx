import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CalendarDays, Gift, User as UserIcon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToListByShareSlug, subscribeToItems, subscribeToSections } from '../lib/firestore'
import type { GiftItem, GiftList, ListSection } from '../types'
import { OCCASION_META } from '../types'
import { useGroupedItems } from '../hooks/useGroupedItems'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { ProgressBar } from '../components/ProgressBar'
import { GuestItemCard } from '../components/GuestItemCard'
import { formatCountdown } from '../utils/format'

export function PublicListPage() {
  const { shareSlug } = useParams<{ shareSlug: string }>()
  const { user, ensureGuestSession } = useAuth()

  const [list, setList] = useState<GiftList | null | undefined>(undefined)
  const [sections, setSections] = useState<ListSection[]>([])
  const [items, setItems] = useState<GiftItem[]>([])
  const [viewerName, setViewerName] = useState('')

  useEffect(() => {
    ensureGuestSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (user?.displayName) setViewerName(user.displayName)
  }, [user])

  useEffect(() => {
    if (!shareSlug) return
    return subscribeToListByShareSlug(shareSlug, setList)
  }, [shareSlug])

  useEffect(() => {
    if (!list) return
    const unsub1 = subscribeToSections(list.id, setSections)
    const unsub2 = subscribeToItems(list.id, setItems)
    return () => {
      unsub1()
      unsub2()
    }
  }, [list])

  const groups = useGroupedItems(sections, items)

  if (list === undefined || !user) return <Spinner full />
  if (list === null) {
    return <EmptyState icon={<Gift className="h-10 w-10" />} title="List not found" description="This link may be incorrect, private, or no longer available." />
  }

  const isOwner = user.uid === list.ownerId
  const meta = OCCASION_META[list.occasion]
  const eventDate = list.eventDate?.toDate?.() ?? null
  const countdown = formatCountdown(eventDate)
  const totalDesired = items.reduce((sum, i) => sum + i.quantityDesired, 0)
  const totalClaimed = items.reduce((sum, i) => sum + i.quantityClaimed, 0)
  const overallPct = totalDesired > 0 ? (totalClaimed / totalDesired) * 100 : 0

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div
        className="mb-6 rounded-2xl p-6 text-white shadow-sm sm:p-8"
        style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}bb)` }}
      >
        <div className="flex items-center gap-2 text-sm text-white/85">
          <span className="text-2xl leading-none">{meta.emoji}</span>
          <span>{list.customOccasionLabel || meta.label}</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{list.title}</h1>
        <p className="mt-1 text-white/85">by {list.ownerDisplayName ?? 'a friend'}</p>
        {list.description && <p className="mt-3 max-w-xl text-sm text-white/85">{list.description}</p>}
        {countdown && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-white/90">
            <CalendarDays className="h-3.5 w-3.5" /> {countdown}
          </p>
        )}
        {totalDesired > 0 && (
          <div className="mt-5 max-w-xs">
            <div className="mb-1 flex justify-between text-xs text-white/85">
              <span>{isOwner ? 'Progress' : 'Claimed'}</span>
              <span>
                {totalClaimed}/{totalDesired}
              </span>
            </div>
            <ProgressBar value={overallPct} className="bg-white/25" />
          </div>
        )}
      </div>

      {!isOwner && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
          <UserIcon className="h-4 w-4 shrink-0 text-slate-400" />
          <label className="text-sm text-slate-500 dark:text-slate-400">Your name:</label>
          <input
            value={viewerName}
            onChange={(e) => setViewerName(e.target.value)}
            placeholder="So the giver knows who's claiming"
            className="flex-1 border-none bg-transparent text-sm text-slate-800 focus:outline-none dark:text-slate-100"
          />
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState icon={<Gift className="h-10 w-10" />} title="No gifts here yet" description="Check back soon — the list owner is still adding to it." />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <div key={group.section?.id ?? 'none'}>
              {group.items.length > 0 && (
                <>
                  <h2 className="mb-2.5 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {group.section?.title ?? 'Other gifts'}
                  </h2>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {group.items.map((item) => (
                      <GuestItemCard key={item.id} listId={list.id} item={item} isOwner={isOwner} viewerUid={user.uid} viewerName={viewerName || 'A guest'} />
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
