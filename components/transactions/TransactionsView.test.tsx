import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSyncExternalStore } from 'react'
import type { Transaction } from '@/types/api'
import { TransactionsView } from './TransactionsView'

// In-memory URL standing in for the App Router.
const nav = vi.hoisted(() => {
  let searchParams = new URLSearchParams()
  const listeners = new Set<() => void>()
  const go = (href: string) => {
    searchParams = new URL(href, 'http://localhost').searchParams
    listeners.forEach((listener) => listener())
  }
  return {
    set: (query: string) => {
      searchParams = new URLSearchParams(query)
    },
    get: () => searchParams,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    router: { push: vi.fn(go), replace: vi.fn(go), back: vi.fn() },
  }
})

vi.mock('next/navigation', () => ({
  useRouter: () => nav.router,
  usePathname: () => '/transactions',
  useSearchParams: () => useSyncExternalStore(nav.subscribe, nav.get),
}))

const tx = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'txn_1',
  reference: 'ACM-1',
  type: 'card_payment',
  status: 'successful',
  currency: 'USD',
  amount: 4599,
  fee: 0,
  narration: 'Card payment - Netflix',
  counterparty: null,
  createdAt: '2026-10-05T10:15:00.000Z',
  ...overrides,
})

const page = (data: Transaction[], meta: { page?: number; total?: number; totalPages?: number } = {}) => ({
  data,
  meta: { page: 1, limit: 20, total: data.length, totalPages: 1, ...meta },
})

type Handler = (url: URL) => { status?: number; body: unknown }
let handler: Handler
const requests: URL[] = []

beforeEach(() => {
  requests.length = 0
  nav.set('')
  vi.clearAllMocks()
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input), 'http://localhost')
      requests.push(url)
      const { status = 200, body } = handler(url)
      return new Response(JSON.stringify(body), { status })
    })
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderView(query = '') {
  nav.set(query)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <TransactionsView />
    </QueryClientProvider>
  )
}

const lastUrl = () => `?${nav.get().toString()}`

describe('TransactionsView', () => {
  it('resets to page 1 when a filter changes, keeping unknown params', async () => {
    handler = () => ({ body: page([tx()], { page: 3, total: 60, totalPages: 3 }) })
    renderView('__scenario=slow&page=3')
    await screen.findByText('Card payment - Netflix')

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'failed')

    expect(nav.router.push).toHaveBeenLastCalledWith('/transactions?__scenario=slow&status=failed', {
      scroll: false,
    })
    await waitFor(() => expect(requests.at(-1)?.searchParams.get('page')).toBe('1'))
  })

  it('debounces search into a single history replace', async () => {
    handler = () => ({ body: page([tx()]) })
    renderView()
    await screen.findByText('Card payment - Netflix')

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search' }), 'abc')

    await waitFor(() => expect(lastUrl()).toBe('?q=abc'))
    expect(nav.router.replace).toHaveBeenCalledTimes(1)
    expect(nav.router.push).not.toHaveBeenCalled()
  })

  it('shows an error on a 500, then recovers on Try again', async () => {
    let fail = true
    handler = () =>
      fail
        ? { status: 500, body: { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } } }
        : { body: page([tx()]) }
    renderView()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent("We couldn't load your transactions")

    fail = false
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Card payment - Netflix')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('keeps the previous rows with an inline error when a page change fails', async () => {
    handler = (url) =>
      url.searchParams.get('page') === '2'
        ? { status: 500, body: { error: { code: 'INTERNAL_ERROR', message: 'Oops' } } }
        : { body: page([tx()], { total: 40, totalPages: 2 }) }
    renderView()
    await screen.findByText('Card payment - Netflix')

    await userEvent.click(screen.getByRole('button', { name: 'Page 2' }))

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't update the list")
    expect(screen.getByText('Card payment - Netflix')).toBeInTheDocument()
    expect(screen.queryByText("We couldn't load your transactions")).toBeNull()
  })

  it('shows "not found" for an unknown ?tx=, and an error (not "not found") for a 500', async () => {
    handler = (url) =>
      url.pathname === '/api/transactions/nope'
        ? { status: 404, body: { error: { code: 'NOT_FOUND', message: 'Transaction nope not found' } } }
        : url.pathname === '/api/transactions/broken'
          ? { status: 500, body: { error: { code: 'INTERNAL_ERROR', message: 'Oops' } } }
          : { body: page([tx()]) }

    const { unmount } = renderView('tx=nope')
    const dialog = await screen.findByRole('dialog', { name: 'Transaction details' })
    expect(await within(dialog).findByText('Transaction not found')).toBeInTheDocument()
    unmount()

    renderView('tx=broken')
    const errorDialog = await screen.findByRole('dialog', { name: 'Transaction details' })
    expect(await within(errorDialog).findByText("We couldn't load this transaction")).toBeInTheDocument()
    expect(within(errorDialog).queryByText('Transaction not found')).toBeNull()
  })

  it('renders narration markup as text in the list and the drawer', async () => {
    const markup = 'Bill payment - Spectranet <img src="x" onerror="alert(1)">'
    const billPayment = tx({ type: 'bill_payment', narration: markup })
    handler = (url) =>
      url.pathname === '/api/transactions' ? { body: page([billPayment]) } : { body: { data: billPayment } }
    renderView()

    const row = await screen.findByRole('button', { name: new RegExp('^Bill payment') })
    expect(within(row).getByText(markup)).toBeInTheDocument()

    await userEvent.click(row)
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getAllByText(markup).length).toBeGreaterThan(0)
    expect(document.querySelector('img')).toBeNull()
    expect(lastUrl()).toBe('?tx=txn_1')
  })

  it('replaces a page past the end with the last page', async () => {
    handler = (url) => ({
      body: page(url.searchParams.get('page') === '99' ? [] : [tx()], {
        page: Number(url.searchParams.get('page')),
        total: 21,
        totalPages: 2,
      }),
    })
    renderView('page=99')

    await waitFor(() => expect(lastUrl()).toBe('?page=2'))
    expect(nav.router.replace).toHaveBeenCalledWith('/transactions?page=2', { scroll: false })
    expect(await screen.findByText('Card payment - Netflix')).toBeInTheDocument()
  })

  it('tells "no transactions yet" apart from "no matches"', async () => {
    handler = () => ({ body: page([]) })
    const { unmount } = renderView()
    expect(await screen.findByText('No transactions yet')).toBeInTheDocument()
    unmount()

    renderView('status=failed')
    expect(await screen.findByText('No transactions match your filters')).toBeInTheDocument()
    expect(screen.getByText('0 results')).toBeInTheDocument()
  })
})
