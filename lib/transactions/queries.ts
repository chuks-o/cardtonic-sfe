'use client'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getTransaction, getTransactions, type TransactionQuery } from '@/lib/api/endpoints'
import type { TransactionParams } from './params'

export const PAGE_SIZE = 20

/** The API query for a page of the list. `tx` is left out so opening details doesn't refetch the list. */
export const toTransactionQuery = ({ q, type, status, page }: TransactionParams): TransactionQuery => ({
  q,
  type,
  status,
  page,
  limit: PAGE_SIZE,
})

export const transactionsKey = (query: TransactionQuery) => ['transactions', query] as const
export const transactionKey = (id: string) => ['transaction', id] as const

export function useTransactions(params: TransactionParams) {
  const query = toTransactionQuery(params)
  return useQuery({
    queryKey: transactionsKey(query),
    // The signal aborts superseded requests (e.g. "a" while "abc" is current), so a slow stale
    // response can't land last.
    queryFn: ({ signal }) => getTransactions(query, { signal }),
    // Keep showing the previous page/filter's rows until the new ones arrive.
    placeholderData: keepPreviousData,
  })
}

export function useTransaction(id: string | undefined) {
  return useQuery({
    queryKey: transactionKey(id ?? ''),
    queryFn: ({ signal }) => getTransaction(id!, { signal }),
    enabled: Boolean(id),
  })
}
