'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { Sidebar } from './sidebar'
import { Header } from './header'

export function PainelLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, setAuth, clearAuth } = useAuthStore()
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function validateSession() {
      if (!isAuthenticated) {
        router.replace('/login')
        setChecking(false)
        return
      }

      // Tenta refresh para validar/renovar o access token (garante que F5 funcione)
      try {
        const res = await fetch('/api/auth/refresh', { method: 'POST' })
        if (res.ok) {
          const data = await res.json()
          setAuth(data.user, data.accessToken)
        } else {
          // Refresh falhou (cookie ausente/expirado) — deslogar
          clearAuth()
          router.replace('/login')
        }
      } catch {
        // Erro de rede — manter sessão para não deslogar sem motivo
      } finally {
        setChecking(false)
      }
    }

    validateSession()
    // Só roda uma vez ao montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (checking) {
    return (
      <div className="flex h-screen bg-[#0b0d11] items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="flex h-screen bg-[#0b0d11] overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
