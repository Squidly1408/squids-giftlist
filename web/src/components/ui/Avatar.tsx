import { cn } from '../../utils/cn'

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export function Avatar({ name, photoURL, size = 'md', className }: { name: string; photoURL?: string | null; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-14 w-14 text-lg' }[size]

  if (photoURL) {
    return <img src={photoURL} alt={name} className={cn('rounded-full object-cover', sizeClasses, className)} />
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 font-semibold text-white',
        sizeClasses,
        className
      )}
    >
      {initialsOf(name || '?') || '?'}
    </div>
  )
}
