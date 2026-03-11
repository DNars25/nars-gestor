'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  MoreHorizontal, RefreshCw, Lock, Unlock, Trash2,
  Edit, Activity, CheckCircle2, XCircle, Clock, Copy, Link,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useApi } from '@/hooks/use-api'
import { copyToClipboard } from '@/lib/clipboard'
import type { XuiUser } from '@/lib/xui-db'

const XUI_HOST = process.env.NEXT_PUBLIC_XUI_HOST || 'http://149.248.46.167'
const XUI_PORT = process.env.NEXT_PUBLIC_XUI_PORT || '80'
const SERVER_URL = `${XUI_HOST}:${XUI_PORT}`

interface ClientTableProps {
  clients: XuiUser[]
  onRefresh: () => void
}

// exp_date é timestamp Unix em SEGUNDOS
function nowSec() { return Math.floor(Date.now() / 1000) }

function getStatus(client: XuiUser): { label: string; className: string; icon: React.ReactNode } {
  if (client.enabled === 0) return {
    label: 'Bloqueado',
    className: 'bg-red-500/10 text-red-400 border-red-500/20',
    icon: <XCircle size={12} />,
  }
  if (client.is_trial) return {
    label: 'Teste',
    className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    icon: <Clock size={12} />,
  }
  if (client.exp_date && client.exp_date > 0 && client.exp_date < nowSec()) return {
    label: 'Expirado',
    className: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    icon: <XCircle size={12} />,
  }
  return {
    label: 'Ativo',
    className: 'bg-green-500/10 text-green-400 border-green-500/20',
    icon: <CheckCircle2 size={12} />,
  }
}

function formatDate(ts: number | null) {
  if (!ts || ts === 0) return '—'
  return format(new Date(ts * 1000), 'dd/MM/yyyy', { locale: ptBR })
}

function getDaysRemaining(ts: number | null): number | null {
  if (!ts || ts === 0) return null
  const diff = ts - nowSec()
  if (diff <= 0) return 0
  return Math.ceil(diff / 86400)
}

function isExpiringSoon(ts: number | null): boolean {
  if (!ts || ts === 0) return false
  const n = nowSec()
  return ts > n && ts < n + 7 * 86400
}

function getM3uLink(username: string, password: string) {
  return `${SERVER_URL}/get.php?username=${username}&password=${password}&type=m3u_plus&output=ts`
}

async function copy(text: string, label: string) {
  try {
    await copyToClipboard(text)
    toast.success(`${label} copiado!`)
  } catch {
    toast.error(`Falha ao copiar ${label}`)
  }
}

export function ClientTable({ clients, onRefresh }: ClientTableProps) {
  const { request } = useApi()
  const [deleteDialog, setDeleteDialog] = useState<XuiUser | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [renewDialog, setRenewDialog] = useState<{ client: XuiUser; months: number } | null>(null)
  const [linkDialog, setLinkDialog] = useState<XuiUser | null>(null)
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
      <div className="py-20 text-center">
        <p className="text-white/30 text-base">Nenhum cliente encontrado</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-2xl border border-white/8 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/8 hover:bg-transparent bg-white/3">
              <TableHead className="text-white/45 text-[12px] font-semibold uppercase tracking-wider py-4 px-5">Usuário</TableHead>
              <TableHead className="text-white/45 text-[12px] font-semibold uppercase tracking-wider py-4">Senha</TableHead>
              <TableHead className="text-white/45 text-[12px] font-semibold uppercase tracking-wider py-4">Vencimento</TableHead>
              <TableHead className="text-white/45 text-[12px] font-semibold uppercase tracking-wider py-4">Conn.</TableHead>
              <TableHead className="text-white/45 text-[12px] font-semibold uppercase tracking-wider py-4">Status</TableHead>
              <TableHead className="text-white/45 text-[12px] font-semibold uppercase tracking-wider py-4 pr-5 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map(client => {
              const status = getStatus(client)
              const expiring = isExpiringSoon(client.exp_date)
              const daysLeft = getDaysRemaining(client.exp_date)
              const isLoading = loading[client.id]
              return (
                <TableRow
                  key={client.id}
                  className={cn(
                    'border-white/5 transition-colors',
                    expiring ? 'hover:bg-orange-500/3' : 'hover:bg-white/3'
                  )}
                >
                  <TableCell className="font-mono text-[14px] text-white py-4 px-5 font-semibold">
                    {client.username}
                    {expiring && (
                      <span className="ml-2 text-[10px] text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded-full">
                        expira em breve
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-[13px] text-white/45 py-4">
                    {client.password}
                  </TableCell>
                  <TableCell className={cn('text-[14px] py-4', expiring ? 'text-orange-400 font-medium' : 'text-white/65')}>
                    <span>{formatDate(client.exp_date)}</span>
                    {daysLeft !== null && (
                      <span className={cn(
                        'ml-2 text-[11px] px-1.5 py-0.5 rounded-md font-medium',
                        daysLeft === 0
                          ? 'text-red-400 bg-red-500/10'
                          : daysLeft <= 7
                          ? 'text-orange-400 bg-orange-500/10'
                          : 'text-white/30 bg-white/5'
                      )}>
                        {daysLeft === 0 ? 'hoje' : `${daysLeft}d`}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-[14px] text-white/65 py-4">
                    {client.max_connections}x
                  </TableCell>
                  <TableCell className="py-4">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold border',
                      status.className
                    )}>
                      {status.icon}
                      {status.label}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 pr-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Copiar link M3U */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setLinkDialog(client)}
                        disabled={isLoading}
                        className="h-9 w-9 p-0 text-white/40 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl"
                        title="Ver link da lista"
                      >
                        <Link size={15} />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setRenewDialog({ client, months: 1 })}
                        disabled={isLoading}
                        className="h-9 w-9 p-0 text-white/40 hover:text-green-400 hover:bg-green-500/10 rounded-xl"
                        title="Renovar"
                      >
                        <RefreshCw size={15} />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleBlock(client)}
                        disabled={isLoading}
                        className={cn(
                          'h-9 w-9 p-0 rounded-xl',
                          client.enabled === 0
                            ? 'text-white/40 hover:text-green-400 hover:bg-green-500/10'
                            : 'text-white/40 hover:text-yellow-400 hover:bg-yellow-500/10'
                        )}
                        title={client.enabled === 0 ? 'Desbloquear' : 'Bloquear'}
                      >
                        {client.enabled === 0 ? <Unlock size={15} /> : <Lock size={15} />}
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="inline-flex items-center justify-center h-9 w-9 rounded-xl text-white/40 hover:text-white hover:bg-white/8 transition-colors"
                        >
                          <MoreHorizontal size={15} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-[#1a1e29] border-white/10 text-white min-w-[180px]"
                        >
                          <DropdownMenuItem
                            onClick={() => copy(getM3uLink(client.username, client.password), 'Link M3U')}
                            className="hover:bg-blue-500/10 cursor-pointer gap-2.5 py-2.5 text-[13px] text-blue-400"
                          >
                            <Copy size={14} /> Copiar Link M3U
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => copy(
                              `Host: ${XUI_HOST.replace(/^https?:\/\//, '')}\nPorta: ${XUI_PORT}\nUsuário: ${client.username}\nSenha: ${client.password}`,
                              'Dados Xtream'
                            )}
                            className="hover:bg-blue-500/10 cursor-pointer gap-2.5 py-2.5 text-[13px] text-blue-400"
                          >
                            <Copy size={14} /> Copiar Xtream
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/8" />
                          <DropdownMenuItem className="hover:bg-white/6 cursor-pointer gap-2.5 py-2.5 text-[13px]">
                            <Edit size={14} className="text-white/50" /> Editar Linha
                          </DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-white/6 cursor-pointer gap-2.5 py-2.5 text-[13px]">
                            <Activity size={14} className="text-white/50" /> Log da Linha
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/8" />
                          <DropdownMenuItem
                            onClick={() => setRenewDialog({ client, months: 1 })}
                            className="hover:bg-green-500/10 cursor-pointer gap-2.5 py-2.5 text-[13px] text-green-400"
                          >
                            <RefreshCw size={14} /> Renovar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/8" />
                          <DropdownMenuItem
                            onClick={() => { setDeleteDialog(client); setDeleteConfirm('') }}
                            className="hover:bg-red-500/10 cursor-pointer gap-2.5 py-2.5 text-[13px] text-red-400"
                          >
                            <Trash2 size={14} /> Excluir Linha
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

      {/* Link Dialog */}
      {linkDialog && (
        <Dialog open={!!linkDialog} onOpenChange={() => setLinkDialog(null)}>
          <DialogContent className="bg-[#13161d] border-white/10 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link size={18} className="text-blue-400" />
                Links de Acesso
              </DialogTitle>
              <DialogDescription className="text-white/50 font-mono text-[13px]">
                {linkDialog.username}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {/* Credenciais */}
              <div className="bg-white/4 border border-white/8 rounded-xl p-4 space-y-3">
                <p className="text-[10px] text-white/35 uppercase tracking-widest font-semibold">Credenciais</p>
                {[
                  { label: 'Usuário', value: linkDialog.username },
                  { label: 'Senha', value: linkDialog.password },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] text-white/40">{label}</p>
                      <p className="font-mono text-[14px] text-white font-semibold">{value}</p>
                    </div>
                    <button
                      onClick={() => copy(value, label)}
                      className="text-white/30 hover:text-white/70 p-1.5 rounded-lg hover:bg-white/8 transition-colors"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* M3U */}
              <div className="bg-white/4 border border-white/8 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] text-white/35 uppercase tracking-widest font-semibold mb-1.5">Link M3U</p>
                    <p className="font-mono text-[10px] text-white/55 break-all leading-relaxed">
                      {getM3uLink(linkDialog.username, linkDialog.password)}
                    </p>
                  </div>
                  <button
                    onClick={() => copy(getM3uLink(linkDialog.username, linkDialog.password), 'Link M3U')}
                    className="flex-shrink-0 mt-0.5 text-white/30 hover:text-white/70 p-1.5 rounded-lg hover:bg-white/8 transition-colors"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              {/* Xtream */}
              <div className="bg-white/4 border border-white/8 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 text-[12px] space-y-1">
                    <p className="text-[10px] text-white/35 uppercase tracking-widest font-semibold mb-2">Xtream Codes</p>
                    <p><span className="text-white/40">Host: </span><span className="font-mono text-white/65">{XUI_HOST.replace(/^https?:\/\//, '')}</span></p>
                    <p><span className="text-white/40">Porta: </span><span className="font-mono text-white/65">{XUI_PORT}</span></p>
                    <p><span className="text-white/40">Usuário: </span><span className="font-mono text-white/65">{linkDialog.username}</span></p>
                    <p><span className="text-white/40">Senha: </span><span className="font-mono text-white/65">{linkDialog.password}</span></p>
                  </div>
                  <button
                    onClick={() => copy(
                      `Host: ${XUI_HOST.replace(/^https?:\/\//, '')}\nPorta: ${XUI_PORT}\nUsuário: ${linkDialog.username}\nSenha: ${linkDialog.password}`,
                      'Dados Xtream'
                    )}
                    className="flex-shrink-0 text-white/30 hover:text-white/70 p-1.5 rounded-lg hover:bg-white/8 transition-colors"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>

            <Button onClick={() => setLinkDialog(null)} className="w-full bg-white/8 hover:bg-white/12 text-white/70 hover:text-white">
              Fechar
            </Button>
          </DialogContent>
        </Dialog>
      )}

      {/* Renovar Dialog */}
      <Dialog open={!!renewDialog} onOpenChange={() => setRenewDialog(null)}>
        <DialogContent className="bg-[#13161d] border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg">Renovar Cliente</DialogTitle>
            <DialogDescription className="text-white/50 text-[14px]">
              Renovar assinatura de <span className="text-orange-400 font-mono font-semibold">{renewDialog?.client.username}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2 py-2">
            {[1, 3, 6, 12].map(m => (
              <button
                key={m}
                onClick={() => setRenewDialog(prev => prev ? { ...prev, months: m } : null)}
                className={cn(
                  'py-4 rounded-xl border flex flex-col items-center gap-1 transition-all',
                  renewDialog?.months === m
                    ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                    : 'border-white/10 text-white/50 hover:border-white/25 hover:text-white'
                )}
              >
                <span className="text-2xl font-bold">{m}</span>
                <span className="text-[11px]">{m === 1 ? 'mês' : 'meses'}</span>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenewDialog(null)} className="text-white/50">
              Cancelar
            </Button>
            <Button
              onClick={() => renewDialog && handleRenew(renewDialog.client, renewDialog.months)}
              disabled={!renewDialog || loading[renewDialog?.client.id]}
              className="bg-green-600 hover:bg-green-700 text-white px-6"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => { setDeleteDialog(null); setDeleteConfirm('') }}>
        <DialogContent className="bg-[#13161d] border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-400 text-lg">Excluir Cliente</DialogTitle>
            <DialogDescription className="text-white/50 text-[14px]">
              Esta ação é irreversível. Digite o nome do usuário para confirmar:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-white/60 text-[13px]">
              Nome: <span className="font-mono text-white/80">{deleteDialog?.username}</span>
            </Label>
            <Input
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder={deleteDialog?.username}
              className="bg-white/5 border-red-500/30 text-white h-11 focus-visible:ring-red-500/40 text-[14px]"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialog(null)} className="text-white/50">
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteConfirm !== deleteDialog?.username || loading[deleteDialog?.id || 0]}
              className="bg-red-600 hover:bg-red-700 text-white px-6"
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
