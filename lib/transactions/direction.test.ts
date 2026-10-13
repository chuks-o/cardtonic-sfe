import { TRANSACTION_TYPES } from '@/types/api'
import { directionOf } from './direction'

describe('directionOf', () => {
  it('classifies every transaction type', () => {
    expect(Object.fromEntries(TRANSACTION_TYPES.map((type) => [type, directionOf(type)]))).toEqual({
      deposit: 'credit',
      transfer_in: 'credit',
      conversion: 'credit',
      withdrawal: 'debit',
      transfer_out: 'debit',
      card_payment: 'debit',
      bill_payment: 'debit',
    })
  })
})
