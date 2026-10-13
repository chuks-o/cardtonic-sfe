import type { Metadata } from 'next'
import { Suspense } from 'react'
import { TransactionsFallback, TransactionsView } from '@/components/transactions/TransactionsView'

export const metadata: Metadata = { title: 'Transactions' }

export default function TransactionsPage() {
  // TransactionsView reads the URL with useSearchParams, which needs a Suspense boundary to prerender.
  return (
    <Suspense fallback={<TransactionsFallback />}>
      <TransactionsView />
    </Suspense>
  )
}
