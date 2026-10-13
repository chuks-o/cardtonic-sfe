import type { TransactionStatus } from '@/types/api'
import { Badge, type BadgeTone } from '@/components/ui'
import { TRANSACTION_STATUS_LABELS } from '@/lib/format'

const TONES: Record<TransactionStatus, BadgeTone> = {
  successful: 'success',
  pending: 'warning',
  failed: 'danger',
}

export function StatusBadge({ status, className }: { status: TransactionStatus; className?: string }) {
  return (
    <Badge tone={TONES[status]} dot className={className}>
      {TRANSACTION_STATUS_LABELS[status]}
    </Badge>
  )
}
