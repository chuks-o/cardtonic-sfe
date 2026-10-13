import {
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
  type TransactionStatus,
  type TransactionType,
} from '@/types/api'

/** Page state that lives in the URL: /transactions?q=&type=&status=&page=&tx= */
export interface TransactionParams {
  q?: string
  type?: TransactionType
  status?: TransactionStatus
  page: number
  /** Id of the transaction open in the details drawer. */
  tx?: string
}

export type TransactionFilters = Pick<TransactionParams, 'q' | 'type' | 'status'>

const OWNED_KEYS = ['q', 'type', 'status', 'page', 'tx'] as const

const includes = <T extends string>(list: readonly T[], value: string | null): value is T =>
  value !== null && (list as readonly string[]).includes(value)

function parsePage(value: string | null): number {
  if (!value || !/^[1-9]\d*$/.test(value)) return 1
  const page = Number(value)
  return Number.isSafeInteger(page) ? page : 1
}

/**
 * Read page state from the URL. Invalid values are dropped rather than sent to the API, so a hand-edited
 * link (?page=abc, ?type=garbage) degrades to the default instead of a 400.
 */
export function parseTransactionParams(searchParams: {
  get(name: string): string | null
}): TransactionParams {
  const type = searchParams.get('type')
  const status = searchParams.get('status')
  return {
    q: searchParams.get('q')?.trim() || undefined,
    type: includes(TRANSACTION_TYPES, type) ? type : undefined,
    status: includes(TRANSACTION_STATUSES, status) ? status : undefined,
    page: parsePage(searchParams.get('page')),
    tx: searchParams.get('tx') || undefined,
  }
}

/**
 * Write page state onto a copy of `base`. Defaults are omitted to keep URLs clean, and params this page
 * doesn't own (e.g. `__scenario`) are preserved.
 */
export function serializeTransactionParams(
  params: TransactionParams,
  base: { toString(): string } = ''
): URLSearchParams {
  const next = new URLSearchParams(base.toString())
  for (const key of OWNED_KEYS) next.delete(key)
  const q = params.q?.trim()
  if (q) next.set('q', q)
  if (params.type) next.set('type', params.type)
  if (params.status) next.set('status', params.status)
  if (params.page > 1) next.set('page', String(params.page))
  if (params.tx) next.set('tx', params.tx)
  return next
}

/** Changing what the list shows starts again from page 1 and closes the details drawer. */
export function withFilters(params: TransactionParams, filters: TransactionFilters): TransactionParams {
  return { ...params, ...filters, page: 1, tx: undefined }
}

export const hasFilters = ({ q, type, status }: TransactionParams) => Boolean(q || type || status)
