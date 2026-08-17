import { Link } from 'react-router-dom'
import { Lock, Link2 } from 'lucide-react'
import type { GiftList } from '../types'
import { OCCASION_META } from '../types'
import { Badge } from './ui/Badge'
import { formatCountdown } from '../utils/format'

export function ListCard({ list }: { list: GiftList }) {
  const meta = OCCASION_META[list.occasion]
  const eventDate = list.eventDate?.toDate?.() ?? null
  const countdown = formatCountdown(eventDate)

  return (
    <Link
      to={`/lists/${list.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
    >
      <div
        className="flex h-24 items-end p-4"
        style={{ background: `linear-gradient(135deg, ${meta.color}dd, ${meta.color}99)` }}
      >
        <span className="text-3xl drop-shadow-sm">{meta.emoji}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-400">
            {list.title}
          </h3>
          {list.visibility === 'private' ? (
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          ) : (
            <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="brand">{list.customOccasionLabel || meta.label}</Badge>
          {list.archived && <Badge tone="neutral">Archived</Badge>}
          {countdown && !list.archived && (
            <Badge tone={countdown === 'Today!' ? 'danger' : 'warning'}>{countdown}</Badge>
          )}
        </div>
        {list.description && <p className="line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{list.description}</p>}
      </div>
    </Link>
  )
}
