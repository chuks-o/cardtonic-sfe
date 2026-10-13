import { api, ApiError } from './client'

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const json = (body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), init)

async function caught(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise
  } catch (error) {
    return error
  }
  throw new Error('Expected the request to reject')
}

describe('api client', () => {
  it('returns the body of a 2xx response', async () => {
    fetchMock.mockResolvedValue(json({ data: { id: 'txn_1' } }))
    await expect(api.get('/transactions/txn_1')).resolves.toEqual({ data: { id: 'txn_1' } })
  })

  it('throws ApiError with the code and message of a 4xx error body', async () => {
    fetchMock.mockResolvedValue(json({ error: { code: 'NOT_FOUND', message: 'Gone' } }, { status: 404 }))
    const error = await caught(api.get('/transactions/nope'))
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 404, code: 'NOT_FOUND', message: 'Gone' })
  })

  it('throws ApiError for a 5xx', async () => {
    fetchMock.mockResolvedValue(
      json({ error: { code: 'INTERNAL_ERROR', message: 'Try again' } }, { status: 500 })
    )
    await expect(api.get('/transactions')).rejects.toMatchObject({ status: 500, code: 'INTERNAL_ERROR' })
  })

  it('falls back to UNKNOWN and statusText when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue(
      new Response('<html>Bad gateway</html>', { status: 502, statusText: 'Bad Gateway' })
    )
    await expect(api.get('/transactions')).rejects.toMatchObject({
      status: 502,
      code: 'UNKNOWN',
      message: 'Bad Gateway',
    })
  })

  it('throws ApiError for a 2xx that is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('ok', { status: 200 }))
    await expect(api.get('/transactions')).rejects.toMatchObject({ status: 200, code: 'INVALID_RESPONSE' })
  })

  it('throws a status 0 ApiError when the network fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(api.get('/transactions')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' })
  })

  it('passes the signal through and rethrows aborts as-is', async () => {
    const controller = new AbortController()
    fetchMock.mockRejectedValue(new DOMException('Aborted', 'AbortError'))
    const error = await caught(api.get('/transactions', { signal: controller.signal }))
    expect(fetchMock.mock.calls[0][1]?.signal).toBe(controller.signal)
    expect(error).not.toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ name: 'AbortError' })
  })

  it('only sends a JSON content type when there is a body', async () => {
    fetchMock.mockImplementation(async () => json({ data: null }))
    await api.get('/me')
    await api.post('/convert', { amount: 1 })
    const [getHeaders, postHeaders] = fetchMock.mock.calls.map(([, init]) => new Headers(init?.headers))
    expect(getHeaders.has('Content-Type')).toBe(false)
    expect(postHeaders.get('Content-Type')).toBe('application/json')
  })
})
