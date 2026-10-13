import { hasFilters, parseTransactionParams, serializeTransactionParams, withFilters } from './params'

const parse = (query: string) => parseTransactionParams(new URLSearchParams(query))

describe('parseTransactionParams', () => {
  it('reads valid values', () => {
    expect(parse('q=netflix&type=card_payment&status=failed&page=3&tx=txn_1')).toEqual({
      q: 'netflix',
      type: 'card_payment',
      status: 'failed',
      page: 3,
      tx: 'txn_1',
    })
  })

  it('defaults to page 1 with nothing set', () => {
    expect(parse('')).toEqual({ page: 1 })
  })

  it('drops unknown type and status', () => {
    expect(parse('type=garbage&status=SUCCESSFUL')).toEqual({ page: 1 })
  })

  it.each(['abc', '0', '-2', '1.5', '2e3', '', '99999999999999999999'])('treats page=%s as 1', (page) => {
    expect(parse(`page=${page}`).page).toBe(1)
  })

  it('trims q and drops it when blank', () => {
    expect(parse('q=%20%20abc%20').q).toBe('abc')
    expect(parse('q=%20%20').q).toBeUndefined()
  })
})

describe('serializeTransactionParams', () => {
  it('omits defaults', () => {
    expect(serializeTransactionParams({ page: 1, q: '  ' }).toString()).toBe('')
  })

  it('writes non-default values', () => {
    expect(serializeTransactionParams({ q: 'abc', type: 'deposit', page: 2, tx: 'txn_1' }).toString()).toBe(
      'q=abc&type=deposit&page=2&tx=txn_1'
    )
  })

  it('preserves params it does not own and replaces the ones it does', () => {
    const base = new URLSearchParams('__scenario=slow&page=4&type=deposit')
    expect(serializeTransactionParams({ page: 1, status: 'pending' }, base).toString()).toBe(
      '__scenario=slow&status=pending'
    )
  })

  it('round-trips with parse', () => {
    const params = { q: 'a b', type: 'conversion', status: 'successful', page: 7, tx: 'txn_x' } as const
    expect(parseTransactionParams(serializeTransactionParams(params))).toEqual(params)
  })
})

describe('withFilters', () => {
  it('resets the page and closes details', () => {
    expect(withFilters({ page: 3, tx: 'txn_1', type: 'deposit' }, { status: 'failed' })).toEqual({
      page: 1,
      tx: undefined,
      type: 'deposit',
      status: 'failed',
    })
  })
})

describe('hasFilters', () => {
  it('is true when search or any filter is set, ignoring page and tx', () => {
    expect(hasFilters({ page: 2, tx: 'txn_1' })).toBe(false)
    expect(hasFilters({ page: 1, q: 'a' })).toBe(true)
    expect(hasFilters({ page: 1, status: 'failed' })).toBe(true)
  })
})
