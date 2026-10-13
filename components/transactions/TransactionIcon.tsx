import type { Transaction, TransactionType } from '@/types/api'
import { Avatar, Icon, type IconName } from '@/components/ui'
import { cx } from '@/lib/cx'
import styles from './TransactionIcon.module.css'

const TYPE_ICONS: Record<TransactionType, IconName> = {
  deposit: 'arrow-down-left',
  transfer_in: 'arrow-down-left',
  withdrawal: 'arrow-up-right',
  transfer_out: 'arrow-up-right',
  conversion: 'swap',
  card_payment: 'card',
  bill_payment: 'receipt',
}

/** Initials for transfers with a counterparty, otherwise the type icon. Decorative. */
export function TransactionIcon({
  transaction: tx,
  size = 'md',
  className,
}: {
  transaction: Transaction
  size?: 'md' | 'lg'
  className?: string
}) {
  const isTransfer = tx.type === 'transfer_in' || tx.type === 'transfer_out'
  if (isTransfer && tx.counterparty) {
    return <Avatar name={tx.counterparty} alt="" size={size} className={className} />
  }
  return (
    <span className={cx(styles.icon, styles[size], className)} aria-hidden>
      <Icon name={TYPE_ICONS[tx.type]} size={size === 'lg' ? 20 : 18} />
    </span>
  )
}
