import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input, Textarea, Select } from './ui/Input'
import { OCCASION_META, type GiftList, type Occasion, type Visibility } from '../types'
import { cn } from '../utils/cn'

export interface ListFormValues {
  title: string
  occasion: Occasion
  customOccasionLabel: string
  description: string
  eventDate: string
  visibility: Visibility
}

interface ListFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: ListFormValues) => Promise<void>
  initial?: GiftList | null
  submitLabel?: string
}

const occasionOrder: Occasion[] = [
  'christmas',
  'birthday',
  'wedding',
  'babyShower',
  'graduation',
  'anniversary',
  'holiday',
  'housewarming',
  'custom',
]

function toDateInputValue(d: Date | null) {
  if (!d) return ''
  const tzOffset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10)
}

export function ListFormModal({ open, onClose, onSubmit, initial, submitLabel = 'Create list' }: ListFormModalProps) {
  const [title, setTitle] = useState('')
  const [occasion, setOccasion] = useState<Occasion>('christmas')
  const [customOccasionLabel, setCustomOccasionLabel] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [visibility, setVisibility] = useState<Visibility>('unlisted')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setTitle(initial?.title ?? '')
    setOccasion(initial?.occasion ?? 'christmas')
    setCustomOccasionLabel(initial?.customOccasionLabel ?? '')
    setDescription(initial?.description ?? '')
    setEventDate(toDateInputValue(initial?.eventDate?.toDate?.() ?? null))
    setVisibility(initial?.visibility ?? 'unlisted')
    setError('')
  }, [open, initial])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Give your list a name.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await onSubmit({ title, occasion, customOccasionLabel, description, eventDate, visibility })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit list' : 'Create a new list'}
      description="Give your gift list a name and occasion — you can add sections and gifts next."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          label="List name"
          required
          placeholder="e.g. Sarah's Christmas List 2026"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Occasion</label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {occasionOrder.map((key) => {
              const meta = OCCASION_META[key]
              const selected = occasion === key
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => setOccasion(key)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-medium transition-colors',
                    selected
                      ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-900/30 dark:text-brand-300'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700/40'
                  )}
                >
                  <span className="text-xl">{meta.emoji}</span>
                  {meta.label}
                </button>
              )
            })}
          </div>
        </div>

        {occasion === 'custom' && (
          <Input
            label="Custom occasion name"
            placeholder="e.g. Retirement Party"
            value={customOccasionLabel}
            onChange={(e) => setCustomOccasionLabel(e.target.value)}
          />
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Event date"
            type="date"
            hint="Optional — powers the countdown badge"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
          <Select label="Who can view" value={visibility} onChange={(e) => setVisibility(e.target.value as Visibility)}>
            <option value="unlisted">Anyone with the link</option>
            <option value="private">Only me</option>
          </Select>
        </div>

        <Textarea
          label="Description"
          placeholder="Anything you'd like people to know before they browse this list"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      </form>
    </Modal>
  )
}
