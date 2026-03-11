'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useApi } from '@/hooks/use-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
  CreditCard, ArrowRight, RefreshCw, Clock,
  ArrowUpRight, ArrowDownLeft, TrendingUp
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface Child {
  id: string
  username: string
  role: string
  credits: number
  status: string
}

interface CreditLog {
  id: string
  fromUserId: string | null
  toUserId: string
  amount: number | string
  type: string
  comment: string
  createdAt: string
  fromUser: { username: string } | null
  toUser: { username: string }
}

interface CreditosData {
  balance: number
  history: CreditLog[]
  children: Child[]
}

const schema = z.object({
  toUserId: z.string().min(1, 'Selecione um destinatário'),
  amount: z.coerce.number().positive('Deve ser positivo').max(999999),
  comment: z.string().min(3, 'Mínimo 3 caracteres').max(300),
  type: z.enum(['TRANSFERENCIA', 'BONUS', 'ESTORNO']),
})

type FormData = z.infer<typeof schema>

export default function CreditosPage() {
  const { request } = useApi()
  const [data, setData] = useState<CreditosData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<FormData, any, FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { type: 'TRANSFERENCIA' },
  })

  const selectedChildId = watch('toUserId')
  const selectedChild = data?.children.find(c => c.id === selectedChildId)

  async function fetchData() {
    setLoading(true)
    try {
      const res = await request<CreditosData>('/api/creditos')
      setData(res)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function onSubmit(formData: any) {
    setSubmitting(true)
    try {
      const res = await request<{ message: string }>('/api/creditos', {
        method: 'POST',
        body: JSON.stringify({ ...formData, amount: Number(formData.amount) }),
      })
      toast.success(res.message)
      reset()
      fetchData()
    } catch (err) {
      toast.error(String(err))
    } finally {
      setSubmitting(false)
    }
  }

  const typeColors: Record<string, string> = {
    TRANSFERENCIA: 'text-blue-400',
    BONUS: 'text-green-400',
    ESTORNO: 'text-red-400',
    DEDUCAO: 'text-red-400',
    ADMIN_AJUSTE: 'text-purple-400',
    COMPRA: 'text-orange-400',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Créditos</h1>
        <p className="text-white/40 text-[14px] mt-1">Saldo e transferências na hierarquia</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Balance + Transfer */}
        <div className="xl:col-span-1 space-y-5">
          {/* Balance card */}
          <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/8 to-transparent p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={16} className="text-orange-400" />
              <span className="text-[13px] font-semibold text-white/50 uppercase tracking-wider">Seu Saldo</span>
            </div>
            {loading ? (
              <div className="h-12 bg-white/10 rounded-xl animate-pulse" />
            ) : (
              <div className="flex items-end gap-2">
                <span className="text-5xl font-bold text-white">{data?.balance.toLocaleString('pt-BR') ?? 0}</span>
                <span className="text-white/40 text-lg mb-1">créditos</span>
              </div>
            )}
          </div>

          {/* Transfer form */}
          <Card className="bg-[#13161d] border-white/8">
            <CardHeader className="pb-4">
              <CardTitle className="text-[16px] font-bold text-white flex items-center gap-2">
                <ArrowRight size={16} className="text-orange-400" />
                Transferir Créditos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[13px] text-white/60">Destinatário</Label>
                  {loading ? (
                    <div className="h-10 bg-white/5 rounded-xl animate-pulse" />
                  ) : (
                    <Select onValueChange={(v: string | null) => v && setValue('toUserId', v)}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white h-11 rounded-xl text-[14px]">
                        <SelectValue placeholder="Selecionar usuário..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1e29] border-white/10 text-white">
                        {data?.children.length === 0 ? (
                          <div className="py-3 px-3 text-[13px] text-white/40">
                            Nenhum usuário na sua hierarquia
                          </div>
                        ) : (
                          data?.children.map(c => (
                            <SelectItem key={c.id} value={c.id} className="text-[14px] py-2.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-semibold">{c.username}</span>
                                <span className="text-[11px] text-white/40">({c.role})</span>
                                <span className="text-[11px] text-orange-400 ml-auto">{c.credits} cr</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  {selectedChild && (
                    <p className="text-[12px] text-white/40">
                      Saldo atual: <span className="text-orange-400 font-semibold">{selectedChild.credits} créditos</span>
                    </p>
                  )}
                  {errors.toUserId && <p className="text-red-400 text-[12px]">{errors.toUserId.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[13px] text-white/60">Quantidade</Label>
                  <Input
                    {...register('amount')}
                    type="number"
                    min={1}
                    placeholder="Ex: 10"
                    className="bg-white/5 border-white/10 text-white h-11 rounded-xl text-[14px] focus-visible:ring-orange-500/40"
                  />
                  {errors.amount && <p className="text-red-400 text-[12px]">{errors.amount.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[13px] text-white/60">Tipo</Label>
                  <Select
                    defaultValue="TRANSFERENCIA"
                    onValueChange={(v: string | null) => v && setValue('type', v as FormData['type'])}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-11 rounded-xl text-[14px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1e29] border-white/10 text-white">
                      <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                      <SelectItem value="BONUS">Bônus</SelectItem>
                      <SelectItem value="ESTORNO">Estorno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[13px] text-white/60">Comentário (obrigatório)</Label>
                  <Textarea
                    {...register('comment')}
                    placeholder="Motivo da transferência..."
                    rows={2}
                    className="bg-white/5 border-white/10 text-white rounded-xl text-[14px] resize-none focus-visible:ring-orange-500/40 placeholder:text-white/25"
                  />
                  {errors.comment && <p className="text-red-400 text-[12px]">{errors.comment.message}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white h-11 rounded-xl font-semibold text-[14px] shadow-lg shadow-orange-500/20"
                >
                  {submitting ? 'Transferindo...' : 'Transferir Créditos'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right: History */}
        <div className="xl:col-span-2">
          <Card className="bg-[#13161d] border-white/8 h-full">
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-[16px] font-bold text-white flex items-center gap-2">
                <TrendingUp size={16} className="text-orange-400" />
                Histórico de Movimentações
              </CardTitle>
              <Button
                onClick={fetchData}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-white/40 hover:text-white rounded-xl"
                disabled={loading}
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 bg-white/4 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : !data?.history.length ? (
                <div className="py-16 text-center">
                  <CreditCard size={36} className="mx-auto mb-3 text-white/15" />
                  <p className="text-white/30 text-[14px]">Nenhuma movimentação registrada</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.history.map(log => {
                    const isOutgoing = log.fromUserId === data.children[0]?.id || log.fromUser !== null
                    return (
                      <div
                        key={log.id}
                        className="flex items-start gap-4 p-4 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 transition-colors"
                      >
                        <div className={cn(
                          'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                          isOutgoing ? 'bg-red-500/10' : 'bg-green-500/10'
                        )}>
                          {isOutgoing
                            ? <ArrowUpRight size={16} className="text-red-400" />
                            : <ArrowDownLeft size={16} className="text-green-400" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[14px] font-semibold text-white leading-tight">
                                {log.fromUser?.username ?? 'Sistema'} → {log.toUser.username}
                              </p>
                              <p className="text-[12px] text-white/40 mt-0.5 truncate">{log.comment}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className={cn('text-[15px] font-bold', typeColors[log.type] || 'text-white')}>
                                {typeof log.amount === 'object'
                                  ? String(log.amount)
                                  : Number(log.amount).toLocaleString('pt-BR')
                                } cr
                              </p>
                              <p className="text-[11px] text-white/30 mt-0.5">
                                {format(new Date(log.createdAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
