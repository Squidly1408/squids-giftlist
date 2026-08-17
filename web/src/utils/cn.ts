import clsx, { type ClassValue } from 'clsx'

/** Tiny className combiner so components can compose conditional Tailwind classes cleanly. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}
