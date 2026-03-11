'use client'

import { useState, useEffect, useCallback } from 'react'
import { useApi } from '@/hooks/use-api'
import { ClientTable } from '@/components/clients/client-table'
import { CreateClientDialog } from '@/components/clients/create-client-dialog'
import { TrialDialog } from '@/components/clients/trial-dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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

  const tabCounts = {
    all: data?.total,
    active: undefined,
    expired: undefined,
    blocked: undefined,
    trial: undefined,
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Clientes</h1>
          <p className="text-white/40 text-[14px] mt-1">
            {data
              ? `${data.total.toLocaleString('pt-BR')} cliente${data.total !== 1 ? 's' : ''} encontrado${data.total !== 1 ? 's' : ''}`
              : 'Carregando...'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Button
            onClick={() => setTrialOpen(true)}
            variant="outline"
            className="border-white/12 bg-white/4 text-white/70 hover:text-white hover:bg-white/8 gap-2 h-10 px-4 text-[13px] font-medium rounded-xl"
          >
            <FlaskConical size={15} />
            Novo Teste
          </Button>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white gap-2 h-10 px-5 text-[13px] font-semibold rounded-xl shadow-lg shadow-orange-500/20"
          >
            <UserPlus size={15} />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative min-w-[260px] flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar por username..."
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/25 h-10 text-[14px] focus-visible:ring-orange-500/40 rounded-xl"
          />
        </div>

        <Tabs value={status} onValueChange={v => { setStatus(v as StatusFilter); setPage(1) }}>
          <TabsList className="bg-white/5 border border-white/10 h-10 rounded-xl p-1">
            {[
              { value: 'all', label: 'Todos' },
              { value: 'active', label: 'Ativos' },
              { value: 'expired', label: 'Expirados' },
              { value: 'blocked', label: 'Bloqueados' },
              { value: 'trial', label: 'Testes' },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="text-[13px] font-medium px-3 h-8 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg"
              >
                {tab.label}
                {tab.value === 'all' && tabCounts.all !== undefined && (
                  <span className="ml-1.5 text-[11px] opacity-60">({tabCounts.all})</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Button
          variant="ghost"
          size="sm"
          onClick={fetchClients}
          disabled={loading}
          className="text-white/40 hover:text-white h-10 w-10 p-0 rounded-xl"
          title="Atualizar"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-white/4 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <ClientTable clients={data?.clients || []} onRefresh={fetchClients} />
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-[13px] text-white/35">
            Mostrando {Math.min((page - 1) * 50 + 1, data.total)}–{Math.min(page * 50, data.total)} de {data.total.toLocaleString('pt-BR')}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border-white/10 bg-white/4 text-white/60 hover:text-white h-9 w-9 p-0 rounded-xl"
            >
              <ChevronLeft size={15} />
            </Button>
            <span className="text-[13px] text-white/50 px-2">
              {page} / {data.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(data.pages, p + 1))}
              disabled={page >= data.pages}
              className="border-white/10 bg-white/4 text-white/60 hover:text-white h-9 w-9 p-0 rounded-xl"
            >
              <ChevronRight size={15} />
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
