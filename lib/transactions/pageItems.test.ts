import { pageItems } from './pageItems'

const show = (current: number, total: number) =>
  pageItems(current, total)
    .map((item) => (typeof item === 'number' ? item : '…'))
    .join(' ')

describe('pageItems', () => {
  it('lists every page when there are few', () => {
    expect(show(1, 1)).toBe('1')
    expect(show(4, 7)).toBe('1 2 3 4 5 6 7')
  })

  it('matches the design on the first page', () => {
    expect(show(1, 12)).toBe('1 2 3 … 12')
  })

  it('shows neighbours of the current page', () => {
    expect(show(6, 12)).toBe('1 … 5 6 7 … 12')
  })

  it('shows a single hidden page instead of an ellipsis', () => {
    expect(show(4, 12)).toBe('1 2 3 4 5 … 12')
    expect(show(9, 12)).toBe('1 … 8 9 10 11 12')
  })

  it('keeps the window at the end', () => {
    expect(show(12, 12)).toBe('1 … 10 11 12')
    expect(show(3, 12)).toBe('1 2 3 4 … 12')
  })
})
