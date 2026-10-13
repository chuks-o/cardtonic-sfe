import { render } from '@testing-library/react'
import { Money } from './Money'

const text = (ui: React.ReactElement) => render(ui).container.textContent

describe('Money', () => {
  it('always shows two decimals', () => {
    expect(text(<Money amount={2500000} currency="NGN" />)).toBe('₦25,000.00')
  })

  it('uses the currency symbol', () => {
    expect(text(<Money amount={121200} currency="GHS" />)).toBe('GH₵1,212.00')
    expect(text(<Money amount={4599} currency="USD" />)).toBe('$45.99')
  })

  it('formats very large amounts exactly', () => {
    expect(text(<Money amount={249999999999} currency="NGN" />)).toBe('₦2,499,999,999.99')
  })

  it('prefixes credits with + and debits with a true minus', () => {
    expect(text(<Money amount={1549} currency="USD" sign="credit" />)).toBe('+$15.49')
    expect(text(<Money amount={1549} currency="USD" sign="debit" />)).toBe('−$15.49')
  })
})
