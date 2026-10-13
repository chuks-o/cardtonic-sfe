import type { TransactionType } from '@/types/api'

const CREDIT_TYPES: ReadonlySet<TransactionType> = new Set(['deposit', 'transfer_in', 'conversion'])

/** Money coming into the wallet. Conversions count as credits: `amount` is what was received. */
export const isCredit = (type: TransactionType) => CREDIT_TYPES.has(type)

export const directionOf = (type: TransactionType) => (isCredit(type) ? 'credit' : 'debit')
