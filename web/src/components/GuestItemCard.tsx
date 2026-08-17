import { useEffect, useState } from 'react'
import { CheckCircle2, ExternalLink, ImageOff, ShoppingCart, Users, X } from 'lucide-react'
import type { Claim, GiftItem } from '../types'
import { PRIORITY_META } from '../types'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { ProgressBar } from './ProgressBar'
import { ClaimModal } from './ClaimModal'
import { subscribeToClaims, addClaim, removeClaim } from '../lib/firestore'
import { formatMoney, hostnameOf } from '../utils/format'
import { useToast } from '../contexts/ToastContext'

interface GuestItemCardProps {
  listId: string
  item: GiftItem
  isOwner: boolean
  viewerUid: string | null
  viewerName: string
}

export function GuestItemCard({ listId, item, isOwner, viewerUid, viewerName }: GuestItemCardProps) {
  const [claims, setClaims] = useState<Claim[]>([])
  const [claimModalOpen, setClaimModalOpen] = useState(false)
  const [imgError, setImgError] = useState(false)
  const { notify } = useToast()

  useEffect(() => {
    if (isOwner) return // owner is denied read access by security rules by design
    return subscribeToClaims(listId, item.id, setClaims)
  }, [listId, item.id, isOwner])

  const price = formatMoney(item.price, item.currency)
  const host = hostnameOf(item.url)
  const claimPct = item.quantityDesired > 0 ? (item.quantityClaimed / item.quantityDesired) * 100 : 0
  const remaining = item.quantityDesired - item.quantityClaimed
  const myClaim = claims.find((c) => c.claimerUid === viewerUid)
  const fullyClaimed = remaining <= 0

  async function handleClaim(values: { name: string; quantity: number; note: string }) {
    if (!viewerUid) return
    await addClaim(listId, item.id, { claimerUid: viewerUid, claimerName: values.name, quantity: values.quantity, note: values.note })
    notify(`You're getting "${item.name}" 🎁`)
  }

  async function handleUnclaim() {
    if (!myClaim) return
    await removeClaim(listId, item.id, myClaim.id)
    notify('Claim removed')
  }

  return (
    <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
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
        </div>
        {item.description && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{item.description}</p>}

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
          {host && (
            <a
              href={item.url ?? undefined}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline dark:text-brand-400"
            >
              View item <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {item.quantityDesired > 1 && (
          <div className="mt-2 flex items-center gap-2">
            <ProgressBar value={claimPct} className="max-w-[120px]" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {item.quantityClaimed}/{item.quantityDesired} claimed
            </span>
          </div>
        )}

        {isOwner ? (
          <p className="mt-2 text-xs italic text-slate-400 dark:text-slate-500">
            {item.quantityClaimed > 0
              ? `${item.quantityClaimed} of ${item.quantityDesired} claimed — kept secret from you 🤫`
              : 'No claims yet'}
          </p>
        ) : (
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {fullyClaimed && !myClaim ? (
              <Badge tone="success">
                <CheckCircle2 className="h-3 w-3" /> Fully claimed
              </Badge>
            ) : myClaim ? (
              <Button size="sm" variant="outline" onClick={handleUnclaim} className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400">
                <X className="h-3.5 w-3.5" /> Cancel your claim
              </Button>
            ) : (
              <Button size="sm" onClick={() => setClaimModalOpen(true)}>
                <CheckCircle2 className="h-3.5 w-3.5" /> I'll get this
              </Button>
            )}
            {claims.length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Users className="h-3.5 w-3.5" />
                {claims.map((c) => c.claimerName).join(', ')}
              </span>
            )}
          </div>
        )}
      </div>

      <ClaimModal open={claimModalOpen} onClose={() => setClaimModalOpen(false)} item={item} defaultName={viewerName} onSubmit={handleClaim} />
    </div>
  )
}
