import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

export function Spinner({ className, full }: { className?: string; full?: boolean }) {
  if (full) {
    return (
      <div className="flex min-h-[40vh] w-full items-center justify-center">
        <Loader2 className={cn('h-8 w-8 animate-spin text-brand-600', className)} />
      </div>
    )
  }
  return <Loader2 className={cn('h-4 w-4 animate-spin', className)} />
}
