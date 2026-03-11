'use client'

import { useState, useEffect } from 'react'
import { useApi } from '@/hooks/use-api'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Network, RefreshCw, CheckCircle2, XCircle, CreditCard, UserPlus, Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface Master {
  id: string
  username: string
  status: 'ATIVO' | 'BLOQUEADO' | 'SUSPENSO'
  credits: number
  createdAt: string
  lastLoginAt: string | null
  investidor: string | null
  revendasCount: number
}

interface Revenda {
  id: string
  username: string
  status: 'ATIVO' | 'BLOQUEADO' | 'SUSPENSO'
  credits: number
  createdAt: string
  lastLoginAt: string | null
  master: { id: string; username: string } | null
}

function StatusBadge({ status }: { status: string }) {
  const map = {
    ATIVO: 'bg-green-500/10 text-green-400 border-green-500/20',
    BLOQUEADO: 'bg-red-500/10 text-red-400 border-red-500/20',
    SUSPENSO: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  }
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold border',
      map[status as keyof typeof map] || 'bg-white/5 text-white/40 border-white/10'
    )}>
      {status === 'ATIVO' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
      {status}
    </span>
  )
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return format(new Date(d), "dd/MM/yy 'às' HH:mm", { locale: ptBR })
}

function SkeletonRow() {
  return (
    <div className="h-16 bg-white/4 rounded-xl animate-pulse mb-2" />
  )
}

export default function RedePage() {
  const { request } = useApi()
  const [tab, setTab] = useState<'masters' | 'revendas'>('masters')
  const [masters, setMasters] = useState<Master[]>([])
  const [revendas, setRevendas] = useState<Revenda[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchData() {
    setLoading(true)
    try {
      if (tab === 'masters') {
        const data = await request<Master[]>('/api/rede/masters')
        setMasters(data)
      } else {
        const data = await request<Revenda[]>('/api/rede/revendas')
        setRevendas(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [tab])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Rede</h1>
          <p className="text-white/40 text-[14px] mt-1">Hierarquia de Masters e Revendas</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-white/12 bg-white/4 text-white/70 hover:text-white hover:bg-white/8 gap-2 h-10 px-4 text-[13px] font-medium rounded-xl"
          >
            <UserPlus size={15} />
            Novo Master
          </Button>
          <Button
            onClick={fetchData}
            variant="ghost"
            className="h-10 w-10 p-0 text-white/40 hover:text-white rounded-xl"
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={v => setTab(v as 'masters' | 'revendas')}>
        <TabsList className="bg-white/5 border border-white/10 h-10 rounded-xl p-1">
          <TabsTrigger
            value="masters"
            className="text-[13px] font-medium px-4 h-8 data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg gap-2"
          >
            <Network size={14} />
            Masters
            {masters.length > 0 && (
              <span className="text-[11px] opacity-70">({masters.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="revendas"
            className="text-[13px] font-medium px-4 h-8 data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg gap-2"
          >
            <Network size={14} />
            Revendas
            {revendas.length > 0 && (
              <span className="text-[11px] opacity-70">({revendas.length})</span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : tab === 'masters' ? (
        masters.length === 0 ? (
          <div className="py-20 text-center">
            <Network size={40} className="mx-auto mb-4 text-white/15" />
            <p className="text-white/30 text-base">Nenhum master cadastrado</p>
            <p className="text-white/20 text-[13px] mt-1">Crie o primeiro master para começar</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/8 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8 bg-white/3">
                  <th className="text-left text-[12px] font-semibold text-white/45 uppercase tracking-wider py-4 px-5">Usuário</th>
                  <th className="text-left text-[12px] font-semibold text-white/45 uppercase tracking-wider py-4">Investidor</th>
                  <th className="text-left text-[12px] font-semibold text-white/45 uppercase tracking-wider py-4">Status</th>
                  <th className="text-left text-[12px] font-semibold text-white/45 uppercase tracking-wider py-4">Créditos</th>
                  <th className="text-left text-[12px] font-semibold text-white/45 uppercase tracking-wider py-4">Revendas</th>
                  <th className="text-left text-[12px] font-semibold text-white/45 uppercase tracking-wider py-4">Último acesso</th>
                  <th className="text-left text-[12px] font-semibold text-white/45 uppercase tracking-wider py-4 pr-5">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {masters.map(m => (
                  <tr key={m.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="py-4 px-5">
                      <p className="text-[14px] font-semibold text-white font-mono">{m.username}</p>
                    </td>
                    <td className="py-4">
                      <span className="text-[13px] text-white/50">{m.investidor ?? '—'}</span>
                    </td>
                    <td className="py-4">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1.5 text-[14px] font-semibold text-white">
                        <CreditCard size={13} className="text-orange-400" />
                        {m.credits.toLocaleString('pt-BR')}
                      </div>
                    </td>
                    <td className="py-4">
                      <Badge variant="outline" className="border-white/15 text-white/60 text-[12px]">
                        {m.revendasCount}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1.5 text-[13px] text-white/40">
                        <Clock size={12} />
                        {formatDate(m.lastLoginAt)}
                      </div>
                    </td>
                    <td className="py-4 pr-5">
                      <span className="text-[13px] text-white/40">
                        {format(new Date(m.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        revendas.length === 0 ? (
          <div className="py-20 text-center">
            <Network size={40} className="mx-auto mb-4 text-white/15" />
            <p className="text-white/30 text-base">Nenhuma revenda cadastrada</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/8 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8 bg-white/3">
                  <th className="text-left text-[12px] font-semibold text-white/45 uppercase tracking-wider py-4 px-5">Usuário</th>
                  <th className="text-left text-[12px] font-semibold text-white/45 uppercase tracking-wider py-4">Master</th>
                  <th className="text-left text-[12px] font-semibold text-white/45 uppercase tracking-wider py-4">Status</th>
                  <th className="text-left text-[12px] font-semibold text-white/45 uppercase tracking-wider py-4">Créditos</th>
                  <th className="text-left text-[12px] font-semibold text-white/45 uppercase tracking-wider py-4">Último acesso</th>
                  <th className="text-left text-[12px] font-semibold text-white/45 uppercase tracking-wider py-4 pr-5">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {revendas.map(r => (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="py-4 px-5">
                      <p className="text-[14px] font-semibold text-white font-mono">{r.username}</p>
                    </td>
                    <td className="py-4">
                      <span className="text-[13px] text-white/50">{r.master?.username ?? '—'}</span>
                    </td>
                    <td className="py-4"><StatusBadge status={r.status} /></td>
                    <td className="py-4">
                      <div className="flex items-center gap-1.5 text-[14px] font-semibold text-white">
                        <CreditCard size={13} className="text-orange-400" />
                        {r.credits.toLocaleString('pt-BR')}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1.5 text-[13px] text-white/40">
                        <Clock size={12} />
                        {formatDate(r.lastLoginAt)}
                      </div>
                    </td>
                    <td className="py-4 pr-5">
                      <span className="text-[13px] text-white/40">
                        {format(new Date(r.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}
