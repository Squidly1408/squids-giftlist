import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Check, Copy } from 'lucide-react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'

export function ShareModal({ open, onClose, shareSlug }: { open: boolean; onClose: () => void; shareSlug: string }) {
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const shareUrl = `${window.location.origin}/l/${shareSlug}`

  useEffect(() => {
    if (!open) return
    QRCode.toDataURL(shareUrl, { width: 220, margin: 1, color: { dark: '#1e1b4b', light: '#ffffff' } }).then(setQrDataUrl)
    setCopied(false)
  }, [open, shareUrl])

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal open={open} onClose={onClose} title="Share this list" description="Anyone with this link can view and claim gifts — no account needed.">
      <div className="flex flex-col items-center gap-4">
        {qrDataUrl && <img src={qrDataUrl} alt="QR code for list link" className="rounded-xl border border-slate-200 dark:border-slate-700" />}

        <div className="flex w-full items-center gap-2">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            onFocus={(e) => e.currentTarget.select()}
          />
          <Button onClick={handleCopy} variant={copied ? 'secondary' : 'primary'}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Tip: this link never shows guests who has claimed what from each other's shopping history — it just keeps the list up to
          date for everyone in real time.
        </p>
      </div>
    </Modal>
  )
}
