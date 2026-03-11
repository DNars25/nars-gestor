'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useApi } from '@/hooks/use-api'
import { CheckCircle2, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrialResult {
  username: string
  password: string
  durationHours: number
}

interface TrialDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function TrialDialog({ open, onClose, onSuccess }: TrialDialogProps) {
  const { request } = useApi()
  const [step, setStep] = useState<1 | 2>(1)
  const [packageType, setPackageType] = useState<'COMPLETO' | 'SEM_ADULTO'>('COMPLETO')
  const [serviceType, setServiceType] = useState<'IPTV' | 'P2P'>('IPTV')
  const [duration, setDuration] = useState(24)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TrialResult | null>(null)

  function handleClose() {
    setStep(1)
    setResult(null)
    onClose()
  }

  async function handleCreate() {
    setLoading(true)
    try {
      const res = await request<TrialResult & { message: string }>('/api/clients/trial', {
        method: 'POST',
        body: JSON.stringify({ packageType, serviceType, durationHours: duration }),
      })
      setResult(res)
      setStep(2)
      toast.success(res.message)
      onSuccess()
    } catch (err) {
      toast.error(String(err))
    } finally {
      setLoading(false)
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiado!`)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#13161d] border-white/10 text-white max-w-sm">
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle>Novo Teste Rápido</DialogTitle>
              <DialogDescription className="text-white/50">
                Configure o pacote de teste
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-white/50 mb-2 uppercase tracking-wider">Pacote</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['COMPLETO', 'SEM_ADULTO'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPackageType(p)}
                      className={cn(
                        'py-3 px-4 rounded-lg border text-sm font-medium transition-colors',
                        packageType === p
                          ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                          : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white'
                      )}
                    >
                      {p === 'COMPLETO' ? 'Completo' : 'Sem Adulto'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-white/50 mb-2 uppercase tracking-wider">Serviço</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['IPTV', 'P2P'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setServiceType(s)}
                      className={cn(
                        'py-3 px-4 rounded-lg border text-sm font-medium transition-colors',
                        serviceType === s
                          ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                          : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white'
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-white/50 mb-2 uppercase tracking-wider">Duração</p>
                <div className="grid grid-cols-3 gap-2">
                  {[6, 12, 24].map(h => (
                    <button
                      key={h}
                      onClick={() => setDuration(h)}
                      className={cn(
                        'py-3 px-2 rounded-lg border text-sm font-medium transition-colors text-center',
                        duration === h
                          ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                          : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white'
                      )}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white mt-2"
            >
              {loading ? 'Criando...' : 'Criar Teste'}
            </Button>
          </>
        )}

        {step === 2 && result && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-400">
                <CheckCircle2 size={20} /> Teste Criado!
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/40">Usuário</p>
                    <p className="font-mono text-white font-medium">{result.username}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(result.username, 'Usuário')}
                    className="text-white/30 hover:text-white/60 transition-colors"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/40">Senha</p>
                    <p className="font-mono text-white font-medium">{result.password}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(result.password, 'Senha')}
                    className="text-white/30 hover:text-white/60 transition-colors"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">
                Expira em {result.durationHours} horas
              </Badge>

              <p className="text-xs text-white/40">
                Você pode editar o usuário e a senha a qualquer momento na lista de clientes.
              </p>
            </div>

            <Button onClick={handleClose} className="w-full bg-white/10 hover:bg-white/20 text-white">
              Fechar
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
