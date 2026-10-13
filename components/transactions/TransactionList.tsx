import type { Transaction } from '@/types/api'
import { Card } from '@/components/ui'
import { cx } from '@/lib/cx'
import { groupByDay } from '@/lib/transactions/groupByDay'
import { TransactionRow } from './TransactionRow'
import styles from './TransactionList.module.css'

export interface TransactionListProps {
  transactions: readonly Transaction[]
  /** Newer results are loading; the rows shown are from the previous page or filter. */
  isBusy: boolean
  onSelect?: (transaction: Transaction) => void
}

/** Day groups are local calendar days, so this must render on the client only. */
export function TransactionList({ transactions, isBusy, onSelect }: TransactionListProps) {
  return (
    <Card padding="none" as="div" className={cx(styles.list, isBusy && styles.busy)}>
      <div aria-busy={isBusy}>
        {groupByDay(transactions).map((group) => (
          <section key={group.key} aria-labelledby={`day-${group.key}`}>
            <h2 id={`day-${group.key}`} className={styles.day}>
              {group.label}
            </h2>
            {group.transactions.map((tx) => (
              <TransactionRow key={tx.id} transaction={tx} onSelect={onSelect} />
            ))}
          </section>
        ))}
      </div>
    </Card>
  )
}
