'use client'

import { useState, useEffect, useCallback } from 'react'
import { useApi } from '@/hooks/use-api'
import { ClientTable } from '@/components/clients/client-table'
import { CreateClientDialog } from '@/components/clients/create-client-dialog'
import { TrialDialog } from '@/components/clients/trial-dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserPlus, FlaskConical, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import type { XuiUser } from '@/lib/xui-db'

interface ClientsResponse {
  clients: XuiUser[]
  total: number
  page: number
  limit: number
  pages: number
}

type StatusFilter = 'all' | 'active' | 'expired' | 'blocked' | 'trial'

export default function ClientesPage() {
  const { request } = useApi()
  const [data, setData] = useState<ClientsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [trialOpen, setTrialOpen] = useState(false)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '50',
        status,
        ...(search && { search }),
      })
      const res = await request<ClientsResponse>(`/api/clients?${params}`)
      setData(res)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, status, search, request])

  useEffect(() => {
    const timer = setTimeout(fetchClients, search ? 400 : 0)
    return () => clearTimeout(timer)
  }, [fetchClients, search])

  function handleStatusChange(val: string) {
    setStatus(val as StatusFilter)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Clientes</h1>
          <p className="text-white/40 text-sm">
            {data ? `${data.total.toLocaleString()} clientes no total` : 'Carregando...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setTrialOpen(true)}
            variant="outline"
            className="border-white/10 text-white/70 hover:text-white hover:bg-white/5 gap-2"
          >
            <FlaskConical size={15} />
            Novo Teste
          </Button>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
          >
            <UserPlus size={15} />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar por username..."
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/20 h-9 focus-visible:ring-orange-500/50"
          />
        </div>

        <Tabs value={status} onValueChange={handleStatusChange}>
          <TabsList className="bg-white/5 border border-white/10 h-9">
            <TabsTrigger value="all" className="text-xs data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              Todos
            </TabsTrigger>
            <TabsTrigger value="active" className="text-xs data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              Ativos
            </TabsTrigger>
            <TabsTrigger value="expired" className="text-xs data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              Expirados
            </TabsTrigger>
            <TabsTrigger value="blocked" className="text-xs data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              Bloqueados
            </TabsTrigger>
            <TabsTrigger value="trial" className="text-xs data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              Testes
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          variant="ghost"
          size="sm"
          onClick={fetchClients}
          disabled={loading}
          className="text-white/40 hover:text-white h-9"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-white/5 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <ClientTable clients={data?.clients || []} onRefresh={fetchClients} />
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-white/40">
            Página {data.page} de {data.pages} ({data.total} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border-white/10 text-white/60 hover:text-white h-8"
            >
              <ChevronLeft size={14} />
            </Button>
            <Badge variant="outline" className="border-white/10 text-white/60 text-xs">
              {page}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(data.pages, p + 1))}
              disabled={page >= data.pages}
              className="border-white/10 text-white/60 hover:text-white h-8"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      <CreateClientDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => { setCreateOpen(false); fetchClients() }}
      />
      <TrialDialog
        open={trialOpen}
        onClose={() => setTrialOpen(false)}
        onSuccess={() => { setTrialOpen(false); fetchClients() }}
      />
    </div>
  )
}
