'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useApi } from '@/hooks/use-api'

const schema = z.object({
  username: z.string().min(3, 'Mínimo 3 caracteres').max(50).regex(/^[a-zA-Z0-9_]+$/, 'Apenas letras, números e _'),
  password: z.string().min(4, 'Mínimo 4 caracteres').max(100),
  expDays: z.number().int().min(1).max(365),
  maxConnections: z.number().int().min(1).max(10),
})

type FormData = z.infer<typeof schema>

interface CreateClientDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const EXP_PRESETS = [
  { label: '1 mês (30 dias)', value: 30 },
  { label: '2 meses (60 dias)', value: 60 },
  { label: '3 meses (90 dias)', value: 90 },
  { label: '6 meses (180 dias)', value: 180 },
  { label: '1 ano (365 dias)', value: 365 },
]

export function CreateClientDialog({ open, onClose, onSuccess }: CreateClientDialogProps) {
  const { request } = useApi()
  const [loading, setLoading] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData, any, FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { expDays: 30, maxConnections: 1 },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function onSubmit(data: any) {
    data = data as FormData
    setLoading(true)
    try {
      const res = await request<{ message: string }>('/api/clients', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      toast.success(res.message)
      reset()
      onSuccess()
    } catch (err) {
      toast.error(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#13161d] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-white/70">Usuário</Label>
            <Input
              {...register('username')}
              placeholder="nome.usuario"
              className="bg-white/5 border-white/10 text-white focus-visible:ring-orange-500/50"
            />
            {errors.username && <p className="text-red-400 text-xs">{errors.username.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/70">Senha</Label>
            <Input
              {...register('password')}
              type="text"
              placeholder="senha123"
              className="bg-white/5 border-white/10 text-white focus-visible:ring-orange-500/50"
            />
            {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-white/70">Validade</Label>
              <Select onValueChange={(v: string | null) => v && setValue('expDays', parseInt(v))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Escolher..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1d24] border-white/10 text-white">
                  {EXP_PRESETS.map(p => (
                    <SelectItem key={p.value} value={String(p.value)}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-white/70">Conexões</Label>
              <Select onValueChange={(v: string | null) => v && setValue('maxConnections', parseInt(v))} defaultValue="1">
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1d24] border-white/10 text-white">
                  {[1, 2, 3, 4, 5].map(n => (
                    <SelectItem key={n} value={String(n)}>{n} conexão{n > 1 ? 'ões' : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="text-white/60">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {loading ? 'Criando...' : 'Criar Cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
