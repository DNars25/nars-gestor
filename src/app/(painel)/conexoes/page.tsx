'use client'

import { useEffect, useState } from 'react'
import { useApi } from '@/hooks/use-api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, RefreshCw, Wifi } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ActiveConnection {
  user_id: number
  username: string
  stream_id: number
  stream_name: string
  user_ip: string
  user_agent: string
  date_start: number
  duration_seconds: number
}

export default function ConexoesPage() {
  const { request } = useApi()
  const [connections, setConnections] = useState<ActiveConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  async function fetchConnections() {
    try {
      setLoading(true)
      const data = await request<ActiveConnection[]>('/api/clients/active-connections')
      setConnections(data)
      setLastUpdate(new Date())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConnections()
    const interval = setInterval(fetchConnections, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity size={20} className="text-green-400" />
            Conexões Ativas
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
              {connections.length}
            </Badge>
          </h1>
          <p className="text-white/40 text-sm">
            Atualiza automaticamente a cada 5 segundos
            {lastUpdate && ` • última: ${formatDistanceToNow(lastUpdate, { locale: ptBR, addSuffix: true })}`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchConnections}
          disabled={loading}
          className="border-white/10 text-white/60 hover:text-white hover:bg-white/5"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin mr-2' : 'mr-2'} />
          Atualizar
        </Button>
      </div>

      {loading && connections.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded animate-pulse" />
          ))}
        </div>
      ) : connections.length === 0 ? (
        <div className="flex items-center justify-center py-24 text-white/20">
          <div className="text-center">
            <Wifi size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Nenhum usuário online</p>
            <p className="text-sm mt-1">Não há conexões ativas nos últimos 5 minutos</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {connections.map((conn, i) => (
            <Card key={`${conn.user_id}-${i}`} className="bg-[#13161d] border-white/10 hover:border-white/20 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
                    <div>
                      <p className="font-mono text-white font-medium text-sm">{conn.username}</p>
                      <p className="text-xs text-white/40">{conn.user_ip}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-white/50">
                    <div>
                      <p className="text-xs text-white/30">Canal Atual</p>
                      <p className="text-white/70">{conn.stream_name || `Stream #${conn.stream_id}`}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/30">Duração</p>
                      <p className="text-white/70">{Math.floor(conn.duration_seconds / 60)}min</p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-green-500/30 text-green-400 text-xs"
                    >
                      Online
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
