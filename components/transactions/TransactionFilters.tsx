'use client'
import { useEffect, useState } from 'react'
import {
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
  type TransactionStatus,
  type TransactionType,
} from '@/types/api'
import { Button, Input, Select } from '@/components/ui'
import { TRANSACTION_STATUS_LABELS, TRANSACTION_TYPE_LABELS } from '@/lib/format'
import {
  hasFilters,
  type TransactionFilters as Filters,
  type TransactionParams,
} from '@/lib/transactions/params'
import type { HistoryMode } from '@/lib/transactions/useTransactionParams'
import styles from './TransactionFilters.module.css'

const SEARCH_DEBOUNCE_MS = 300

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  ...TRANSACTION_TYPES.map((type) => ({ value: type, label: TRANSACTION_TYPE_LABELS[type] })),
]

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...TRANSACTION_STATUSES.map((status) => ({ value: status, label: TRANSACTION_STATUS_LABELS[status] })),
]

export interface TransactionFiltersProps {
  params: TransactionParams
  onChange: (filters: Filters, mode: HistoryMode) => void
  onClear: () => void
}

export function TransactionFilters({ params, onChange, onClear }: TransactionFiltersProps) {
  const urlQuery = params.q ?? ''
  // Local state so typing is instant; the URL follows after a pause.
  const [draft, setDraft] = useState(urlQuery)
  const [syncedQuery, setSyncedQuery] = useState(urlQuery)

  // Resync when the URL changes underneath us (Back/Forward, Clear filters). Skip it when the URL
  // only caught up with what's already typed, so trailing spaces aren't wiped mid-word.
  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery)
    if (draft.trim() !== urlQuery) setDraft(urlQuery)
  }

  useEffect(() => {
    if (draft.trim() === urlQuery) return
    // replace, not push: one history entry per search, not per keystroke.
    const timer = setTimeout(() => onChange({ q: draft }, 'replace'), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [draft, urlQuery, onChange])

  const clear = () => {
    setDraft('')
    onClear()
  }

  return (
    <div className={styles.filters} role="search">
      <Input
        type="search"
        label="Search"
        placeholder="Search by reference, name or narration"
        leadingIcon="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        fieldClassName={styles.search}
      />
      <Select
        label="Type"
        options={TYPE_OPTIONS}
        value={params.type ?? ''}
        onChange={(event) =>
          onChange({ type: (event.target.value || undefined) as TransactionType | undefined }, 'push')
        }
        fieldClassName={styles.select}
      />
      <Select
        label="Status"
        options={STATUS_OPTIONS}
        value={params.status ?? ''}
        onChange={(event) =>
          onChange({ status: (event.target.value || undefined) as TransactionStatus | undefined }, 'push')
        }
        fieldClassName={styles.select}
      />
      {(hasFilters(params) || draft.trim() !== '') && (
        <Button variant="ghost" onClick={clear} className={styles.clear}>
          Clear filters
        </Button>
      )}
    </div>
  )
}
