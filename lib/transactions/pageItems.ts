export type PageItem = number | 'ellipsis-start' | 'ellipsis-end'

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i)

/**
 * Page numbers to show: first, last, and the current page with one neighbour each side. An ellipsis
 * replaces gaps of two or more pages; a gap of one page shows that page instead.
 * pageItems(1, 12) -> [1, 2, 3, 'ellipsis-end', 12]
 */
export function pageItems(current: number, total: number): PageItem[] {
  if (total <= 7) return range(1, total)

  // Keep the window from shrinking at the edges: 1 2 3 … 12 and 1 … 10 11 12.
  let start = Math.max(2, Math.min(current - 1, total - 2))
  let end = Math.min(total - 1, Math.max(current + 1, 3))
  if (start === 3) start = 2
  if (end === total - 2) end = total - 1

  return [
    1,
    ...(start > 2 ? (['ellipsis-start'] as const) : []),
    ...range(start, end),
    ...(end < total - 1 ? (['ellipsis-end'] as const) : []),
    total,
  ]
}
