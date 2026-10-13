import type { Transaction } from '@/types/api'
import { formatDate } from '@/lib/format'

export interface DayGroup {
  /** Local calendar day, YYYY-MM-DD. */
  key: string
  label: string
  transactions: Transaction[]
}

const pad = (n: number) => String(n).padStart(2, '0')
const localDayKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

/**
 * Group a newest-first list into runs of the same calendar day in the user's timezone, keeping order.
 * Depends on the runtime timezone, so only call it on the client.
 */
export function groupByDay(transactions: readonly Transaction[], now: Date = new Date()): DayGroup[] {
  const today = localDayKey(now)
  const yesterday = localDayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))

  const groups: DayGroup[] = []
  for (const tx of transactions) {
    const key = localDayKey(new Date(tx.createdAt))
    const last = groups[groups.length - 1]
    if (last?.key === key) {
      last.transactions.push(tx)
    } else {
      const label = key === today ? 'Today' : key === yesterday ? 'Yesterday' : formatDate(tx.createdAt)
      groups.push({ key, label, transactions: [tx] })
    }
  }
  return groups
}
