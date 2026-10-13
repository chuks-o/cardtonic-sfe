import { render, screen } from '@testing-library/react'
import { Navbar } from './Navbar'

const pathname = vi.hoisted(() => ({ current: '/' }))

vi.mock('next/navigation', () => ({ usePathname: () => pathname.current }))
vi.mock('./UserMenu', () => ({ UserMenu: () => null }))

describe('Navbar', () => {
  it('marks the link for the current path as active', () => {
    pathname.current = '/transactions'
    render(<Navbar />)
    expect(screen.getByRole('link', { name: 'Transactions' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current')
  })

  it('follows client-side navigation', () => {
    pathname.current = '/'
    const { rerender } = render(<Navbar />)
    pathname.current = '/convert'
    rerender(<Navbar />)
    expect(screen.getByRole('link', { name: 'Convert' })).toHaveAttribute('aria-current', 'page')
  })
})
