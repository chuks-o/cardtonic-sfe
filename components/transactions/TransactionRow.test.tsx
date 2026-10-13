import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Transaction } from '@/types/api'
import { TransactionRow } from './TransactionRow'

const base: Transaction = {
  id: 'txn_1',
  reference: 'ACM-1',
  type: 'bill_payment',
  status: 'failed',
  currency: 'NGN',
  amount: 1850000,
  fee: 3000,
  narration: 'Bill payment - Spectranet <img src="x" onerror="alert(1)">',
  counterparty: null,
  createdAt: '2026-10-05T10:15:00.000Z',
}

describe('TransactionRow', () => {
  it('renders narration as text, never as HTML', () => {
    const { container } = render(<TransactionRow transaction={base} />)
    expect(screen.getByText(base.narration)).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })

  it('shows a labelled status badge, signed amount and local time, but no fee', () => {
    render(<TransactionRow transaction={base} />)
    expect(screen.getByText('Failed')).toBeInTheDocument()
    expect(screen.getByText('−₦18,500.00')).toBeInTheDocument()
    expect(screen.getByText('11:15')).toBeInTheDocument() // 10:15 UTC in Africa/Lagos
    expect(screen.queryByText(/fee/i)).toBeNull()
  })

  it('has an accessible name with type, amount and status', () => {
    render(<TransactionRow transaction={base} />)
    expect(screen.getByRole('button')).toHaveAccessibleName(
      `Bill payment, −₦18,500.00, Failed, ${base.narration}, 11:15`
    )
  })

  it('shows initials for a transfer with a counterparty and marks credits', () => {
    render(
      <TransactionRow
        transaction={{ ...base, type: 'transfer_in', status: 'successful', counterparty: 'Ada Okafor' }}
      />
    )
    expect(screen.getByText('AO')).toBeInTheDocument()
    expect(screen.getByText('+₦18,500.00')).toBeInTheDocument()
  })

  it('reports the selected transaction', async () => {
    const onSelect = vi.fn()
    render(<TransactionRow transaction={base} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith(base)
  })
})
