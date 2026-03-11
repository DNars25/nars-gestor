'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ServiceStatus {
  status: 'ok' | 'error'
  latency?: number
  error?: string
}

interface HealthData {
  status: 'healthy' | 'degraded'
  services: {
    database_painel: ServiceStatus
    database_xui: ServiceStatus
    redis: ServiceStatus
  }
  totalLatency: number
  timestamp: string
}

export function HealthStatus() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchHealth() {
    try {
      setLoading(true)
      const res = await fetch('/api/health')
      const data = await res.json()
      setHealth(data)
    } catch {
      // ignorar
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const serviceLabels: Record<string, string> = {
    database_painel: 'BD Painel',
    database_xui: 'BD XUI',
    redis: 'Redis',
  }

  return (
    <Card className="bg-[#13161d] border-white/10">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-white/70">Status dos Serviços</CardTitle>
        <button onClick={fetchHealth} className="text-white/40 hover:text-white transition-colors">
          <RefreshCw size={14} className={cn(loading && 'animate-spin')} />
        </button>
      </CardHeader>
      <CardContent>
        {loading && !health ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-8 bg-white/5 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {health && Object.entries(health.services).map(([key, svc]) => (
              <div key={key} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  {svc.status === 'ok' ? (
                    <CheckCircle2 size={14} className="text-green-400" />
                  ) : (
                    <XCircle size={14} className="text-red-400" />
                  )}
                  <span className="text-sm text-white/70">{serviceLabels[key] || key}</span>
                </div>
                <div className="flex items-center gap-2">
                  {svc.latency !== undefined && (
                    <span className="text-xs text-white/30">{svc.latency}ms</span>
                  )}
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] px-1.5',
                      svc.status === 'ok'
                        ? 'border-green-500/30 text-green-400'
                        : 'border-red-500/30 text-red-400'
                    )}
                  >
                    {svc.status === 'ok' ? 'OK' : 'ERRO'}
                  </Badge>
                </div>
              </div>
            ))}

            {health && (
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div className="flex items-center gap-1.5">
                  {health.status === 'healthy' ? (
                    <CheckCircle2 size={12} className="text-green-400" />
                  ) : (
                    <AlertCircle size={12} className="text-yellow-400" />
                  )}
                  <span className="text-xs text-white/40">
                    {health.status === 'healthy' ? 'Sistema saudável' : 'Sistema degradado'}
                  </span>
                </div>
                <span className="text-xs text-white/30">{health.totalLatency}ms total</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
