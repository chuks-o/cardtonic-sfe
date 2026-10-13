import { formatMoney, formatSignedMoney, parseMoney } from './money'

describe('formatMoney', () => {
  it('formats minor units with two decimals', () => {
    expect(formatMoney(150050, 'NGN')).toBe('₦1,500.50')
    expect(formatMoney(85020, 'GHS')).toBe('GH₵850.20')
    expect(formatMoney(4599, 'USD')).toBe('$45.99')
  })

  it('can always show the sign', () => {
    expect(formatMoney(-4599, 'USD', { signDisplay: 'always' })).toBe('-$45.99')
    expect(formatMoney(2500000, 'NGN', { signDisplay: 'always' })).toBe('+₦25,000.00')
  })
})

describe('formatSignedMoney', () => {
  it('prefixes credits with + and debits with a true minus', () => {
    expect(formatSignedMoney(2500000, 'NGN', 'credit')).toBe('+₦25,000.00')
    expect(formatSignedMoney(1549, 'USD', 'debit')).toBe('\u2212$15.49')
  })
})

describe('parseMoney', () => {
  it('parses decimal input into minor units without float error', () => {
    expect(parseMoney('19.99', 'USD')).toBe(1999)
    expect(parseMoney('1,500.5', 'NGN')).toBe(150050)
    expect(parseMoney('7', 'GHS')).toBe(700)
  })

  it('rejects invalid input', () => {
    expect(parseMoney('', 'NGN')).toBeNull()
    expect(parseMoney('1.234', 'NGN')).toBeNull()
    expect(parseMoney('abc', 'NGN')).toBeNull()
  })
})
