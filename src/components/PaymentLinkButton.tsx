'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { toast } from 'sonner'

export default function PaymentLinkButton({ invoiceId, status }: { invoiceId: string; status: string }) {
  const [loading, setLoading] = useState(false)

  if (status === 'pagado') return null

  async function generateLink() {
    setLoading(true)
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pay`, { method: 'POST' })
      if (res.ok) {
        const { url } = await res.json()
        await navigator.clipboard.writeText(url)
        toast.success('Payment link copied to clipboard')
      } else {
        toast.error('Error generating payment link')
      }
    } catch { toast.error('Error generating payment link') }
    setLoading(false)
  }

  return <Button size="sm" variant="secondary" onClick={generateLink} loading={loading}>Generate Payment Link</Button>
}
