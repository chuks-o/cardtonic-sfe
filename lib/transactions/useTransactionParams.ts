'use client'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo, useRef } from 'react'
import {
  parseTransactionParams,
  serializeTransactionParams,
  withFilters,
  type TransactionFilters,
  type TransactionParams,
} from './params'

export type HistoryMode = 'push' | 'replace'

/** Page state read from, and written to, the URL. Needs a <Suspense> boundary (useSearchParams). */
export function useTransactionParams() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const params = useMemo(() => parseTransactionParams(searchParams), [searchParams])

  const navigate = useCallback(
    (next: TransactionParams, mode: HistoryMode) => {
      const query = serializeTransactionParams(next, searchParams).toString()
      router[mode](query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  const setFilters = useCallback(
    (filters: TransactionFilters, mode: HistoryMode = 'push') => navigate(withFilters(params, filters), mode),
    [navigate, params]
  )

  const setPage = useCallback(
    (page: number, mode: HistoryMode = 'push') => navigate({ ...params, page, tx: undefined }, mode),
    [navigate, params]
  )

  // Whether this page pushed the current ?tx= entry. If it did, closing goes Back so the history
  // doesn't fill with open/close pairs. If not (deep link, reload), there is nothing of ours to go back to.
  const pushedTx = useRef(false)

  const openTx = useCallback(
    (tx: string) => {
      pushedTx.current = true
      navigate({ ...params, tx }, 'push')
    },
    [navigate, params]
  )

  const closeTx = useCallback(() => {
    if (pushedTx.current) {
      pushedTx.current = false
      router.back()
    } else {
      navigate({ ...params, tx: undefined }, 'replace')
    }
  }, [navigate, params, router])

  return { params, navigate, setFilters, setPage, openTx, closeTx }
}
