import { cn } from '../utils/cn'

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700', className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-[width] duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
