import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input, Textarea } from './ui/Input'
import type { GiftItem } from '../types'

interface ClaimModalProps {
  open: boolean
  onClose: () => void
  item: GiftItem
  defaultName: string
  onSubmit: (values: { name: string; quantity: number; note: string }) => Promise<void>
}

export function ClaimModal({ open, onClose, item, defaultName, onSubmit }: ClaimModalProps) {
  const remaining = Math.max(1, item.quantityDesired - item.quantityClaimed)
  const [name, setName] = useState(defaultName)
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setName(defaultName)
      setQuantity(1)
      setNote('')
      setError('')
    }
  }, [open, defaultName])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Enter your name so the gift-giver knows it was you.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await onSubmit({ name, quantity, note })
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
      title={`Get "${item.name}"`}
      description="This just marks it as taken for other guests — the list owner never sees who claimed what."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            Confirm
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Your name" required value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        {remaining > 1 && (
          <Input
            label="How many are you getting?"
            type="number"
            min={1}
            max={remaining}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(remaining, Number(e.target.value) || 1)))}
            hint={`${remaining} still needed`}
          />
        )}
        <Textarea
          label="Note (optional)"
          placeholder="e.g. Getting it in blue, arriving next week"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      </form>
    </Modal>
  )
}
