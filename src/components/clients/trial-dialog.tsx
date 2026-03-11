'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useApi } from '@/hooks/use-api'
import { CheckCircle2, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

const SERVER_URL = process.env.NEXT_PUBLIC_XUI_SERVER_URL || 'http://149.248.46.167:80'

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

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiado!`)
  }

  const m3uLink = result
    ? `${SERVER_URL}/get.php?username=${result.username}&password=${result.password}&type=m3u_plus&output=ts`
    : ''

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#13161d] border-white/10 text-white max-w-sm">
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle>Novo Teste Rápido</DialogTitle>
              <DialogDescription className="text-white/50">
                Configure o pacote de teste — credenciais geradas automaticamente
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <p className="text-[11px] text-white/40 uppercase tracking-wider font-semibold mb-2">Pacote</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['COMPLETO', 'SEM_ADULTO'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPackageType(p)}
                      className={cn(
                        'py-3 px-4 rounded-xl border text-[13px] font-medium transition-colors',
                        packageType === p
                          ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                          : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white'
                      )}
                    >
                      {p === 'COMPLETO' ? 'Completo' : 'Sem +18'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] text-white/40 uppercase tracking-wider font-semibold mb-2">Serviço</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['IPTV', 'P2P'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setServiceType(s)}
                      className={cn(
                        'py-3 px-4 rounded-xl border text-[13px] font-medium transition-colors',
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
                <p className="text-[11px] text-white/40 uppercase tracking-wider font-semibold mb-2">Duração</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {[2, 4, 6, 12, 24].map(h => (
                    <button
                      key={h}
                      onClick={() => setDuration(h)}
                      className={cn(
                        'py-3 rounded-xl border text-[13px] font-bold transition-colors text-center',
                        duration === h
                          ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                          : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/70'
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
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold mt-1"
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
              {/* Credenciais */}
              <div className="bg-white/4 border border-white/8 rounded-xl p-4 space-y-3">
                <p className="text-[10px] text-white/35 uppercase tracking-widest font-semibold">Credenciais</p>
                {[
                  { label: 'Usuário', value: result.username },
                  { label: 'Senha', value: result.password },
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
                    <p className="font-mono text-[10px] text-white/50 break-all leading-relaxed">{m3uLink}</p>
                  </div>
                  <button
                    onClick={() => copy(m3uLink, 'Link M3U')}
                    className="flex-shrink-0 mt-0.5 text-white/30 hover:text-white/70 p-1.5 rounded-lg hover:bg-white/8 transition-colors"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              {/* Xtream */}
              <div className="bg-white/4 border border-white/8 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 text-[11px] space-y-0.5">
                    <p className="text-[10px] text-white/35 uppercase tracking-widest font-semibold mb-1.5">Xtream Codes</p>
                    <p><span className="text-white/40">Servidor: </span><span className="font-mono text-white/60">{SERVER_URL}</span></p>
                    <p><span className="text-white/40">Usuário: </span><span className="font-mono text-white/60">{result.username}</span></p>
                    <p><span className="text-white/40">Senha: </span><span className="font-mono text-white/60">{result.password}</span></p>
                  </div>
                  <button
                    onClick={() => copy(
                      `Servidor: ${SERVER_URL}\nUsuário: ${result.username}\nSenha: ${result.password}`,
                      'Dados Xtream'
                    )}
                    className="flex-shrink-0 text-white/30 hover:text-white/70 p-1.5 rounded-lg hover:bg-white/8 transition-colors"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">
                Expira em {result.durationHours} hora{result.durationHours > 1 ? 's' : ''}
              </Badge>
            </div>

            <Button onClick={handleClose} className="w-full bg-white/8 hover:bg-white/12 text-white/70 hover:text-white">
              Fechar
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
