'use client'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import type { Transaction } from '@/types/api'
import { Drawer } from '@/components/ui'
import { hasFilters } from '@/lib/transactions/params'
import { PAGE_SIZE, transactionKey, useTransactions } from '@/lib/transactions/queries'
import { useTransactionParams } from '@/lib/transactions/useTransactionParams'
import { Pagination } from './Pagination'
import { TransactionDetails } from './TransactionDetails'
import { TransactionFilters } from './TransactionFilters'
import { TransactionList } from './TransactionList'
import {
  EmptyState,
  ErrorState,
  FilteredEmptyState,
  InlineError,
  ListSkeleton,
} from './TransactionListStates'
import styles from './TransactionsView.module.css'

const CLEARED = { q: undefined, type: undefined, status: undefined }

function Header({ subtitle }: { subtitle?: string }) {
  return (
    <header>
      <h1 className={styles.title}>Transactions</h1>
      {/* Reserve the line while loading so the layout doesn't jump. */}
      <p className={styles.subtitle} aria-live="polite">
        {subtitle ?? ' '}
      </p>
    </header>
  )
}

/** Suspense fallback while the URL is read on the client. */
export function TransactionsFallback() {
  return (
    <div className={styles.page}>
      <Header />
      <ListSkeleton />
    </div>
  )
}

export function TransactionsView() {
  const { params, navigate, setFilters, setPage, openTx, closeTx } = useTransactionParams()
  const queryClient = useQueryClient()
  const { data, isError, isFetching, isPlaceholderData, refetch } = useTransactions(params)
  const isFiltered = hasFilters(params)

  // When a page or filter change fails, keep the last rows on screen instead of blanking the list.
  const [lastData, setLastData] = useState(data)
  if (data && !isPlaceholderData && data !== lastData) setLastData(data)
  const shown = data ?? (isError ? lastData : undefined)

  const meta = data && !isPlaceholderData ? data.meta : undefined
  const isPastLastPage = meta !== undefined && params.page > meta.totalPages

  // Deep link to ?page=99, or the list shrank: go to the last page that exists.
  useEffect(() => {
    if (isPastLastPage) navigate({ ...params, page: meta.totalPages }, 'replace')
  }, [isPastLastPage, meta?.totalPages, navigate, params])

  const clearFilters = useCallback(() => setFilters(CLEARED, 'push'), [setFilters])
  const retry = () => void refetch()

  // Seed the details cache from the row so the drawer renders instantly instead of flashing a skeleton.
  const openDetails = (tx: Transaction) => {
    queryClient.setQueryData(transactionKey(tx.id), { data: tx })
    openTx(tx.id)
  }

  const total = shown?.meta?.total
  const subtitle =
    total === undefined
      ? undefined
      : total === 0 && isFiltered
        ? '0 results'
        : `${total.toLocaleString('en-NG')} ${total === 1 ? 'transaction' : 'transactions'}`

  let content
  if (!shown || isPastLastPage) {
    content = isError ? <ErrorState onRetry={retry} isRetrying={isFetching} /> : <ListSkeleton />
  } else if (shown.data.length === 0 && total === 0) {
    content = isFiltered ? <FilteredEmptyState onClear={clearFilters} /> : <EmptyState />
  } else {
    content = (
      <>
        {isError && <InlineError onRetry={retry} isRetrying={isFetching} />}
        <TransactionList transactions={shown.data} isBusy={isFetching} onSelect={openDetails} />
        {shown.meta && (
          <Pagination
            page={shown.meta.page}
            totalPages={shown.meta.totalPages}
            total={shown.meta.total}
            pageSize={PAGE_SIZE}
            onPageChange={(page) => setPage(page)}
          />
        )}
      </>
    )
  }

  return (
    <div className={styles.page}>
      <Header subtitle={subtitle} />
      <TransactionFilters params={params} onChange={setFilters} onClear={clearFilters} />
      <div className={styles.content}>{content}</div>
      <Drawer open={params.tx !== undefined} title="Transaction details" onClose={closeTx}>
        {params.tx && <TransactionDetails key={params.tx} id={params.tx} onBack={closeTx} />}
      </Drawer>
    </div>
  )
}
