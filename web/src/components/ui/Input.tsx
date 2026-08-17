import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

const fieldClasses =
  'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-brand-400'

interface FieldWrapperProps {
  label?: string
  hint?: string
  error?: string
  required?: boolean
}

function FieldLabel({ label, required }: { label?: string; required?: boolean }) {
  if (!label) return null
  return (
    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
      {label}
      {required && <span className="text-rose-500"> *</span>}
    </label>
  )
}

function FieldMessage({ hint, error }: { hint?: string; error?: string }) {
  if (error) return <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{error}</p>
  if (hint) return <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
  return null
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & FieldWrapperProps

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, required, id, ...props }, ref) => (
    <div>
      <FieldLabel label={label} required={required} />
      <input
        ref={ref}
        id={id}
        className={cn(fieldClasses, error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20', className)}
        {...props}
      />
      <FieldMessage hint={hint} error={error} />
    </div>
  )
)
Input.displayName = 'Input'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldWrapperProps

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hint, error, required, id, ...props }, ref) => (
    <div>
      <FieldLabel label={label} required={required} />
      <textarea ref={ref} id={id} className={cn(fieldClasses, 'resize-none', className)} {...props} />
      <FieldMessage hint={hint} error={error} />
    </div>
  )
)
Textarea.displayName = 'Textarea'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & FieldWrapperProps

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, hint, error, required, id, children, ...props }, ref) => (
    <div>
      <FieldLabel label={label} required={required} />
      <select ref={ref} id={id} className={cn(fieldClasses, 'cursor-pointer', className)} {...props}>
        {children}
      </select>
      <FieldMessage hint={hint} error={error} />
    </div>
  )
)
Select.displayName = 'Select'
