'use client'
import { QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { createQueryClient } from '@/lib/api/queryClient'

export function Providers({ children }: { children: ReactNode }) {
  // One client per browser session (and per request on the server), never shared between users.
  const [queryClient] = useState(createQueryClient)
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
