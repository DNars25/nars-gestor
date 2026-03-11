'use client'

import { useEffect, useState } from 'react'
import { useApi } from '@/hooks/use-api'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { ClientsChart } from '@/components/dashboard/clients-chart'
import { HealthStatus } from '@/components/dashboard/health-status'
import { useAuthStore } from '@/store/auth.store'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardStats {
  totalClients: number
  activeClients: number
  trialClients: number
  onlineNow: number
  expiringClients: number
  mastersCount: number
  revendasCount: number
  newClientsChart: { date: string; count: number }[]
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { request } = useApi()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchStats() {
    try {
      setLoading(true)
      const data = await request<DashboardStats>('/api/dashboard/stats')
      setStats(data)
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 60000) // atualizar a cada minuto
    return () => clearInterval(interval)
  }, [])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">
            {greeting()}, {user?.username}!
          </h1>
          <p className="text-white/40 text-sm mt-0.5">
            Visão geral do sistema IPTV
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          disabled={loading}
          className="border-white/10 text-white/60 hover:text-white hover:bg-white/5"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin mr-2' : 'mr-2'} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} isLoading={loading} />

      {/* Charts + Health */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <ClientsChart
            data={stats?.newClientsChart || []}
            isLoading={loading}
          />
        </div>
        <div>
          <HealthStatus />
        </div>
      </div>
    </div>
  )
}
