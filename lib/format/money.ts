import type { Currency } from '@/types/api'

const MINOR_UNITS_PER_MAJOR: Record<Currency, number> = { NGN: 100, USD: 100, GHS: 100 }

const formatters = new Map<string, Intl.NumberFormat>()

function getFormatter(currency: Currency, signDisplay: Intl.NumberFormatOptions['signDisplay']) {
  const cacheKey = `${currency}:${signDisplay}`
  let formatter = formatters.get(cacheKey)
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      signDisplay,
    })
    formatters.set(cacheKey, formatter)
  }
  return formatter
}

/**
 * Format an amount in minor units, e.g. formatMoney(150050, 'NGN') -> "₦1,500.50".
 * Use `signDisplay: 'always'` with a negative value for debits.
 */
export function formatMoney(
  minor: number,
  currency: Currency,
  { signDisplay = 'auto' }: { signDisplay?: Intl.NumberFormatOptions['signDisplay'] } = {}
): string {
  return getFormatter(currency, signDisplay).format(minor / MINOR_UNITS_PER_MAJOR[currency])
}

/** formatMoney with a leading "+" for credits or a true minus (U+2212) for debits. `minor` is positive. */
export function formatSignedMoney(minor: number, currency: Currency, direction: 'credit' | 'debit'): string {
  return `${direction === 'credit' ? '+' : '\u2212'}${formatMoney(minor, currency)}`
}

/** Parse user input like "1,500.5" into minor units (150050). Returns null if invalid. */
export function parseMoney(input: string, currency: Currency): number | null {
  const cleaned = input.replace(/,/g, '').trim()
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null
  const [whole, fraction = ''] = cleaned.split('.')
  return Number(whole) * MINOR_UNITS_PER_MAJOR[currency] + Number(fraction.padEnd(2, '0'))
}
