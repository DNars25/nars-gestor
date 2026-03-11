'use client'

import { useCallback } from 'react'
import { useAuthStore } from '@/store/auth.store'

export function useApi() {
  const { accessToken, updateToken, clearAuth } = useAuthStore()

  const request = useCallback(
    async <T = unknown>(
      url: string,
      options: RequestInit = {}
    ): Promise<T> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      }

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }

      let res = await fetch(url, { ...options, headers })

      // Token expirado → tentar refresh
      if (res.status === 401 && accessToken) {
        const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' })
        if (refreshRes.ok) {
          const data = await refreshRes.json()
          updateToken(data.accessToken)
          headers['Authorization'] = `Bearer ${data.accessToken}`
          res = await fetch(url, { ...options, headers })
        } else {
          clearAuth()
          window.location.href = '/login'
          throw new Error('Sessão expirada')
        }
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      return res.json() as Promise<T>
    },
    [accessToken, updateToken, clearAuth]
  )

  return { request }
}
