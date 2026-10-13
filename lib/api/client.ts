import type { ApiErrorBody, ApiSuccess } from '@/types/api'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api'

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

function errorFromBody(body: unknown): Partial<ApiErrorBody['error']> {
  if (typeof body !== 'object' || body === null || !('error' in body)) return {}
  const { error } = body as { error: unknown }
  if (typeof error !== 'object' || error === null) return {}
  const { code, message } = error as Record<string, unknown>
  return {
    code: typeof code === 'string' ? code : undefined,
    message: typeof message === 'string' ? message : undefined,
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<ApiSuccess<T>> {
  const headers = new Headers(init.headers)
  if (init.body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  } catch (error) {
    // Let aborts through untouched so callers (and react-query) can tell cancellation from failure.
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, 'NETWORK_ERROR', 'Network error. Check your connection and try again.')
  }

  const body = parseJson(await res.text())

  if (!res.ok) {
    const { code, message } = errorFromBody(body)
    throw new ApiError(res.status, code ?? 'UNKNOWN', message ?? (res.statusText || 'Request failed'))
  }
  if (body === undefined) {
    throw new ApiError(res.status, 'INVALID_RESPONSE', 'The server returned an unexpected response.')
  }
  return body as ApiSuccess<T>
}

export const api = {
  get: <T>(path: string, init?: RequestInit) => request<T>(path, init),
  post: <T>(path: string, body: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'POST', body: JSON.stringify(body) }),
}
