import { useState } from 'react'
import { ExternalLink, MoreVertical, Pencil, Trash2, ImageOff, ShoppingCart } from 'lucide-react'
import type { GiftItem } from '../types'
import { PRIORITY_META } from '../types'
import { Badge } from './ui/Badge'
import { ProgressBar } from './ProgressBar'
import { formatMoney, hostnameOf } from '../utils/format'

export function ItemCard({
  item,
  onEdit,
  onDelete,
}: {
  item: GiftItem
  onEdit: () => void
  onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [imgError, setImgError] = useState(false)
  const price = formatMoney(item.price, item.currency)
  const host = hostnameOf(item.url)
  const claimPct = item.quantityDesired > 0 ? (item.quantityClaimed / item.quantityDesired) * 100 : 0

  return (
    <div className="group relative flex gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-700">
        {item.imageUrl && !imgError ? (
          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" onError={() => setImgError(true)} />
        ) : (
          <ImageOff className="h-5 w-5 text-slate-400" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-medium text-slate-900 dark:text-slate-100">{item.name}</p>
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded-md p-1 text-slate-400 opacity-0 hover:bg-slate-100 group-hover:opacity-100 dark:hover:bg-slate-700"
              aria-label="Item options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-20 mt-1 w-36 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      onEdit()
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      onDelete()
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {item.description && <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">{item.description}</p>}

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {price && <Badge tone="neutral">{price}</Badge>}
          <Badge tone={item.priority === 'high' ? 'danger' : item.priority === 'medium' ? 'warning' : 'neutral'}>
            {PRIORITY_META[item.priority].label}
          </Badge>
          {item.source === 'amazon' && (
            <Badge tone="brand">
              <ShoppingCart className="h-3 w-3" /> Amazon
            </Badge>
          )}
          {item.quantityDesired > 1 && <Badge tone="neutral">Qty {item.quantityDesired}</Badge>}
          {host && (
            <a
              href={item.url ?? undefined}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline dark:text-brand-400"
            >
              {host} <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {item.quantityClaimed > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <ProgressBar value={claimPct} className="max-w-[120px]" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {item.quantityClaimed}/{item.quantityDesired} claimed
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
