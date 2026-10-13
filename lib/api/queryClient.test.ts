import { ApiError } from './client'
import { retryDelay, shouldRetry } from './queryClient'

describe('shouldRetry', () => {
  it('retries network failures and 5xx up to twice', () => {
    expect(shouldRetry(0, new ApiError(0, 'NETWORK_ERROR', ''))).toBe(true)
    expect(shouldRetry(1, new ApiError(500, 'INTERNAL_ERROR', ''))).toBe(true)
    expect(shouldRetry(2, new ApiError(503, 'UNKNOWN', ''))).toBe(false)
  })

  it('never retries 4xx', () => {
    expect(shouldRetry(0, new ApiError(404, 'NOT_FOUND', ''))).toBe(false)
    expect(shouldRetry(0, new ApiError(400, 'INVALID_PAGINATION', ''))).toBe(false)
  })

  it('does not retry unknown errors', () => {
    expect(shouldRetry(0, new Error('bug'))).toBe(false)
  })
})

describe('retryDelay', () => {
  it('backs off exponentially with a cap', () => {
    expect([0, 1, 2, 5].map(retryDelay)).toEqual([500, 1000, 2000, 4000])
  })
})
