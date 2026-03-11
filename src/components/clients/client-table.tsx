'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  MoreHorizontal, RefreshCw, Lock, Unlock, Trash2,
  Edit, Info, Activity, CheckCircle2, XCircle, Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useApi } from '@/hooks/use-api'
import type { XuiUser } from '@/lib/xui-db'

interface ClientTableProps {
  clients: XuiUser[]
  onRefresh: () => void
}

function getStatus(client: XuiUser): { label: string; color: string; icon: React.ReactNode } {
  if (client.enabled === 0) return { label: 'Bloqueado', color: 'text-red-400', icon: <XCircle size={12} /> }
  if (client.is_trial) return { label: 'Teste', color: 'text-yellow-400', icon: <Clock size={12} /> }
  if (client.exp_date && client.exp_date < Date.now()) return { label: 'Expirado', color: 'text-orange-400', icon: <XCircle size={12} /> }
  return { label: 'Ativo', color: 'text-green-400', icon: <CheckCircle2 size={12} /> }
}

function formatDate(ts: number | null) {
  if (!ts || ts === 0) return 'Sem data'
  return format(new Date(ts), 'dd/MM/yyyy', { locale: ptBR })
}

export function ClientTable({ clients, onRefresh }: ClientTableProps) {
  const { request } = useApi()
  const [deleteDialog, setDeleteDialog] = useState<XuiUser | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [renewDialog, setRenewDialog] = useState<{ client: XuiUser; months: number } | null>(null)
  const [loading, setLoading] = useState<Record<number, boolean>>({})

  function setClientLoading(id: number, val: boolean) {
    setLoading(prev => ({ ...prev, [id]: val }))
  }

  async function handleToggleBlock(client: XuiUser) {
    setClientLoading(client.id, true)
    try {
      await request(`/api/clients/${client.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled: client.enabled === 0 }),
      })
      toast.success(client.enabled === 0 ? `${client.username} desbloqueado` : `${client.username} bloqueado`)
      onRefresh()
    } catch (err) {
      toast.error(String(err))
    } finally {
      setClientLoading(client.id, false)
    }
  }

  async function handleRenew(client: XuiUser, months: number) {
    setClientLoading(client.id, true)
    try {
      const res = await request<{ message: string }>(`/api/clients/${client.id}/renew`, {
        method: 'POST',
        body: JSON.stringify({ months }),
      })
      toast.success(res.message)
      onRefresh()
      setRenewDialog(null)
    } catch (err) {
      toast.error(String(err))
    } finally {
      setClientLoading(client.id, false)
    }
  }

  async function handleDelete() {
    if (!deleteDialog) return
    if (deleteConfirm !== deleteDialog.username) {
      toast.error('Nome de usuário incorreto')
      return
    }
    setClientLoading(deleteDialog.id, true)
    try {
      await request(`/api/clients/${deleteDialog.id}`, { method: 'DELETE' })
      toast.success(`${deleteDialog.username} excluído`)
      setDeleteDialog(null)
      setDeleteConfirm('')
      onRefresh()
    } catch (err) {
      toast.error(String(err))
    } finally {
      setClientLoading(deleteDialog.id, false)
    }
  }

  if (clients.length === 0) {
    return (
      <div className="py-12 text-center text-white/30">
        Nenhum cliente encontrado
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/50 text-xs uppercase tracking-wider">Usuário</TableHead>
              <TableHead className="text-white/50 text-xs uppercase tracking-wider">Senha</TableHead>
              <TableHead className="text-white/50 text-xs uppercase tracking-wider">Vencimento</TableHead>
              <TableHead className="text-white/50 text-xs uppercase tracking-wider">Conexões</TableHead>
              <TableHead className="text-white/50 text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-white/50 text-xs uppercase tracking-wider text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map(client => {
              const status = getStatus(client)
              const isLoading = loading[client.id]
              return (
                <TableRow key={client.id} className="border-white/5 hover:bg-white/3">
                  <TableCell className="font-mono text-sm text-white py-3">
                    {client.username}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-white/50 py-3">
                    {client.password}
                  </TableCell>
                  <TableCell className="text-sm text-white/70 py-3">
                    {formatDate(client.exp_date)}
                  </TableCell>
                  <TableCell className="text-sm text-white/70 py-3">
                    {client.max_connections}
                  </TableCell>
                  <TableCell className="py-3">
                    <div className={cn('flex items-center gap-1.5 text-xs font-medium', status.color)}>
                      {status.icon}
                      {status.label}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Renovar rápido */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setRenewDialog({ client, months: 1 })}
                        disabled={isLoading}
                        className="h-7 px-2 text-white/50 hover:text-green-400 hover:bg-green-500/10"
                        title="Renovar"
                      >
                        <RefreshCw size={13} />
                      </Button>

                      {/* Bloquear/Desbloquear */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleBlock(client)}
                        disabled={isLoading}
                        className={cn(
                          'h-7 px-2',
                          client.enabled === 0
                            ? 'text-white/50 hover:text-green-400 hover:bg-green-500/10'
                            : 'text-white/50 hover:text-yellow-400 hover:bg-yellow-500/10'
                        )}
                        title={client.enabled === 0 ? 'Desbloquear' : 'Bloquear'}
                      >
                        {client.enabled === 0 ? <Unlock size={13} /> : <Lock size={13} />}
                      </Button>

                      {/* Menu mais opções */}
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="inline-flex items-center justify-center h-7 w-7 rounded-md text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <MoreHorizontal size={13} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-[#1a1d24] border-white/10 text-white/80 text-sm"
                        >
                          <DropdownMenuItem className="hover:bg-white/5 cursor-pointer gap-2">
                            <Edit size={13} /> Editar Linha
                          </DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-white/5 cursor-pointer gap-2">
                            <Info size={13} /> Informações da Linha
                          </DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-white/5 cursor-pointer gap-2">
                            <Activity size={13} /> Log da Linha
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem
                            onClick={() => setRenewDialog({ client, months: 1 })}
                            className="hover:bg-white/5 cursor-pointer gap-2 text-green-400"
                          >
                            <RefreshCw size={13} /> Renovar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem
                            onClick={() => { setDeleteDialog(client); setDeleteConfirm('') }}
                            className="hover:bg-red-500/10 cursor-pointer gap-2 text-red-400"
                          >
                            <Trash2 size={13} /> Excluir Linha
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Renovar Dialog */}
      <Dialog open={!!renewDialog} onOpenChange={() => setRenewDialog(null)}>
        <DialogContent className="bg-[#13161d] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Renovar Cliente</DialogTitle>
            <DialogDescription className="text-white/50">
              Renova a assinatura de <span className="text-orange-400 font-mono">{renewDialog?.client.username}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2 py-2">
            {[1, 3, 6, 12].map(m => (
              <Button
                key={m}
                variant={renewDialog?.months === m ? 'default' : 'outline'}
                onClick={() => setRenewDialog(prev => prev ? { ...prev, months: m } : null)}
                className={cn(
                  'h-16 flex-col gap-1',
                  renewDialog?.months === m
                    ? 'bg-orange-500 hover:bg-orange-600 border-orange-500'
                    : 'border-white/10 hover:bg-white/5 bg-transparent text-white'
                )}
              >
                <span className="text-2xl font-bold">{m}</span>
                <span className="text-xs">{m === 1 ? 'mês' : 'meses'}</span>
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenewDialog(null)} className="text-white/60">
              Cancelar
            </Button>
            <Button
              onClick={() => renewDialog && handleRenew(renewDialog.client, renewDialog.months)}
              disabled={!renewDialog || loading[renewDialog?.client.id]}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Confirmar Renovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => { setDeleteDialog(null); setDeleteConfirm('') }}>
        <DialogContent className="bg-[#13161d] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-400">Excluir Cliente</DialogTitle>
            <DialogDescription className="text-white/50">
              Esta ação é irreversível. Para confirmar, digite o nome do usuário:
              <span className="font-mono text-white ml-1">{deleteDialog?.username}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-white/70">Nome do usuário</Label>
            <Input
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder={deleteDialog?.username}
              className="bg-white/5 border-red-500/30 text-white focus-visible:ring-red-500/50"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialog(null)} className="text-white/60">
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteConfirm !== deleteDialog?.username || loading[deleteDialog?.id || 0]}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir Definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
