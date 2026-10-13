import { QueryClient } from '@tanstack/react-query'
import { isApiError } from './client'

const MAX_RETRIES = 2

/** Retry network failures (status 0) and 5xx, never 4xx: a bad request or missing record won't fix itself. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) return false
  return isApiError(error) && (error.status === 0 || error.status >= 500)
}

/** 500ms, 1s, ... capped at 4s. */
export const retryDelay = (attempt: number) => Math.min(500 * 2 ** attempt, 4000)

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        retryDelay,
        // A paged list reshuffling when the tab regains focus is surprising; refetch on demand instead.
        refetchOnWindowFocus: false,
      },
    },
  })
}
