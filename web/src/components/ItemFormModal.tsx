import { useEffect, useState, type FormEvent } from 'react'
import { Link as LinkIcon } from 'lucide-react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input, Textarea, Select } from './ui/Input'
import type { GiftItem, ListSection, Priority } from '../types'

export interface ItemFormValues {
  sectionId: string | null
  name: string
  description: string
  url: string
  imageUrl: string | null
  price: number | null
  currency: string
  priority: Priority
  quantityDesired: number
  source: GiftItem['source']
}

interface ItemFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: ItemFormValues) => Promise<void>
  sections: ListSection[]
  initial?: GiftItem | null
  defaultSectionId?: string | null
}

export function ItemFormModal({ open, onClose, onSubmit, sections, initial, defaultSectionId }: ItemFormModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [imageUrl] = useState<string | null>(null)
  const [price, setPrice] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [quantityDesired, setQuantityDesired] = useState(1)
  const [sectionId, setSectionId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setName(initial?.name ?? '')
    setDescription(initial?.description ?? '')
    setUrl(initial?.url ?? '')
    setPrice(initial?.price != null ? String(initial.price) : '')
    setPriority(initial?.priority ?? 'medium')
    setQuantityDesired(initial?.quantityDesired ?? 1)
    setSectionId(initial?.sectionId ?? defaultSectionId ?? null)
    setError('')
  }, [open, initial, defaultSectionId])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Give the gift a name.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await onSubmit({
        sectionId,
        name,
        description,
        url,
        imageUrl,
        price: price.trim() === '' ? null : Number(price),
        currency: 'USD',
        priority,
        quantityDesired: Math.max(1, quantityDesired),
        source: initial?.source ?? 'manual',
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit gift' : 'Add a gift'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            {initial ? 'Save changes' : 'Add gift'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <LinkIcon className="h-6 w-6 text-slate-300" />
            )}
          </div>
          <div className="flex-1">
            <Input label="Gift name" required value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
        </div>

        <Input
          label="Link (optional)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          hint="Paste a product page link so people can see what it is — the site's own photo won't be pulled in automatically."
        />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Input label="Price (optional)" type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
          <Select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            <option value="high">Really want</option>
            <option value="medium">Would like</option>
            <option value="low">If possible</option>
          </Select>
          <Input
            label="Quantity"
            type="number"
            min={1}
            value={quantityDesired}
            onChange={(e) => setQuantityDesired(Math.max(1, Number(e.target.value) || 1))}
          />
        </div>

        <Select label="Section" value={sectionId ?? ''} onChange={(e) => setSectionId(e.target.value || null)}>
          <option value="">No section</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </Select>

        <Textarea
          label="Notes (optional)"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Size, color, or any other detail"
        />

        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      </form>
    </Modal>
  )
}
