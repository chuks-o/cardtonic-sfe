import type { Transaction } from '@/types/api'
import { Money } from '@/components/ui'
import {
  formatDateTime,
  formatSignedMoney,
  formatTime,
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_TYPE_LABELS,
} from '@/lib/format'
import { directionOf } from '@/lib/transactions/direction'
import { StatusBadge } from './StatusBadge'
import { TransactionIcon } from './TransactionIcon'
import styles from './TransactionRow.module.css'

export interface TransactionRowProps {
  transaction: Transaction
  onSelect?: (transaction: Transaction) => void
  /** Show the date as well as the time, for lists without day headers. */
  showDate?: boolean
}

/** Times are in the user's timezone, so render rows on the client only. */
export function TransactionRow({ transaction: tx, onSelect, showDate = false }: TransactionRowProps) {
  const direction = directionOf(tx.type)
  const time = showDate ? formatDateTime(tx.createdAt) : formatTime(tx.createdAt)
  const label = [
    TRANSACTION_TYPE_LABELS[tx.type],
    formatSignedMoney(tx.amount, tx.currency, direction),
    TRANSACTION_STATUS_LABELS[tx.status],
    tx.narration,
    time,
  ].join(', ')

  return (
    <button type="button" className={styles.row} onClick={() => onSelect?.(tx)} aria-label={label}>
      <TransactionIcon transaction={tx} className={styles.lead} />
      <span className={styles.main}>
        <span className={styles.title}>{TRANSACTION_TYPE_LABELS[tx.type]}</span>
        <span className={styles.narration}>{tx.narration}</span>
      </span>
      <StatusBadge status={tx.status} className={styles.status} />
      <Money
        amount={tx.amount}
        currency={tx.currency}
        sign={direction}
        className={direction === 'credit' ? styles.credit : styles.amount}
      />
      <time className={styles.time} dateTime={tx.createdAt}>
        {time}
      </time>
    </button>
  )
}
