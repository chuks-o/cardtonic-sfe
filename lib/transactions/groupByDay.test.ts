import type { Transaction } from '@/types/api'
import { groupByDay } from './groupByDay'

// vitest.config.mts pins TZ=Africa/Lagos (UTC+1), so UTC and local days differ for an hour after
// 23:00 UTC.

const tx = (id: string, createdAt: string): Transaction => ({
  id,
  reference: id,
  type: 'deposit',
  status: 'successful',
  currency: 'NGN',
  amount: 100,
  fee: 0,
  narration: '',
  counterparty: null,
  createdAt,
})

const summary = (groups: ReturnType<typeof groupByDay>) =>
  groups.map((g) => [g.label, g.transactions.map((t) => t.id)])

describe('groupByDay', () => {
  it('runs in a non-UTC timezone', () => {
    expect(new Date('2026-10-12T23:30:00.000Z').getTimezoneOffset()).toBe(-60)
  })

  it('groups by the local calendar day across a UTC-midnight boundary', () => {
    const now = new Date('2026-10-13T09:00:00.000Z') // 10:00 on 13 Oct in Lagos
    const groups = groupByDay(
      [
        tx('a', '2026-10-13T08:00:00.000Z'), // 13 Oct 09:00 local
        tx('b', '2026-10-12T23:30:00.000Z'), // 13 Oct 00:30 local, still "Today" despite the UTC date
        tx('c', '2026-10-12T22:30:00.000Z'), // 12 Oct 23:30 local
        tx('d', '2026-10-11T23:10:00.000Z'), // 12 Oct 00:10 local
        tx('e', '2026-10-11T22:59:00.000Z'), // 11 Oct 23:59 local
      ],
      now
    )
    expect(summary(groups)).toEqual([
      ['Today', ['a', 'b']],
      ['Yesterday', ['c', 'd']],
      ['Sun, 11 Oct 2026', ['e']],
    ])
    expect(groups.map((g) => g.key)).toEqual(['2026-10-13', '2026-10-12', '2026-10-11'])
  })

  it('handles yesterday across a month boundary', () => {
    const groups = groupByDay([tx('a', '2026-09-30T12:00:00.000Z')], new Date('2026-10-01T12:00:00.000Z'))
    expect(summary(groups)).toEqual([['Yesterday', ['a']]])
  })

  it('returns no groups for no transactions', () => {
    expect(groupByDay([], new Date())).toEqual([])
  })
})
