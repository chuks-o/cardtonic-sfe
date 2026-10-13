import { render, screen } from '@testing-library/react'
import type { Transaction } from '@/types/api'
import { TransactionRow } from './TransactionRow'

const tx: Transaction = {
  id: 'txn_1',
  reference: 'ACM-1',
  type: 'bill_payment',
  status: 'successful',
  currency: 'NGN',
  amount: 150050,
  fee: 3000,
  narration: 'Bill payment - Spectranet <img src="x" onerror="alert(1)">',
  counterparty: null,
  createdAt: '2026-10-05T10:15:00.000Z',
}

describe('TransactionRow', () => {
  it('renders narration as text, never as HTML', () => {
    const { container } = render(<TransactionRow transaction={tx} />)
    expect(screen.getByText(tx.narration)).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })

  it('does not show the fee', () => {
    render(<TransactionRow transaction={tx} />)
    expect(screen.queryByText(/fee/i)).toBeNull()
  })
})
