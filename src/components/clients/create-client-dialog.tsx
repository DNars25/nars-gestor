'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useApi } from '@/hooks/use-api'
import { Copy, RefreshCw, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { copyToClipboard } from '@/lib/clipboard'

const XUI_HOST = process.env.NEXT_PUBLIC_XUI_HOST || 'http://149.248.46.167'
const XUI_PORT = process.env.NEXT_PUBLIC_XUI_PORT || '80'
const SERVER_URL = `${XUI_HOST}:${XUI_PORT}`

function genUsername() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return 'usr' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function genPassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

interface CreateClientDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface CreatedResult {
  username: string
  password: string
  type: 'normal' | 'trial'
  durationLabel: string
}

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const HOURS = [2, 4, 6, 12, 24]

function getDefaultState() {
  return {
    clientType: 'normal' as 'normal' | 'trial',
    months: 1,
    hours: 24,
    username: genUsername(),
    password: genPassword(),
    showPass: false,
    maxConn: 1,
    bouquet: '1' as '1' | '2',
  }
}

export function CreateClientDialog({ open, onClose, onSuccess }: CreateClientDialogProps) {
  const { request } = useApi()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'result'>('form')
  const [result, setResult] = useState<CreatedResult | null>(null)
  const [state, setState] = useState(getDefaultState)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function set<K extends keyof typeof state>(key: K, value: (typeof state)[K]) {
    setState(prev => ({ ...prev, [key]: value }))
  }

  function validate() {
    const errs: Record<string, string> = {}
    if (!state.username || state.username.length < 3) errs.username = 'Mínimo 3 caracteres'
    else if (!/^[a-zA-Z0-9_]+$/.test(state.username)) errs.username = 'Apenas letras, números e _'
    if (!state.password || state.password.length < 4) errs.password = 'Mínimo 4 caracteres'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setLoading(true)
    try {
      const payload = state.clientType === 'trial'
        ? { username: state.username, password: state.password, expHours: state.hours, bouquet: state.bouquet, maxConnections: state.maxConn, isTrial: true }
        : { username: state.username, password: state.password, expDays: state.months * 30, bouquet: state.bouquet, maxConnections: state.maxConn, isTrial: false }

      await request('/api/clients', { method: 'POST', body: JSON.stringify(payload) })

      setResult({
        username: state.username,
        password: state.password,
        type: state.clientType,
        durationLabel: state.clientType === 'trial'
          ? `${state.hours} hora${state.hours > 1 ? 's' : ''}`
          : `${state.months} mês${state.months > 1 ? 'es' : ''} (${state.months * 30} dias)`,
      })
      setStep('result')
      onSuccess()
    } catch (err) {
      toast.error(String(err))
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setState(getDefaultState())
    setErrors({})
    setStep('form')
    setResult(null)
    onClose()
  }

  async function copy(text: string, label: string) {
    try {
      await copyToClipboard(text)
      toast.success(`${label} copiado!`)
    } catch {
      toast.error(`Falha ao copiar ${label}`)
    }
  }

  const m3uLink = result
    ? `${SERVER_URL}/get.php?username=${result.username}&password=${result.password}&type=m3u_plus&output=ts`
    : ''

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#13161d] border-white/10 text-white max-w-md">

        {/* ──── STEP 1: FORM ──── */}
        {step === 'form' && (
          <>
            <DialogHeader>
              <DialogTitle>Novo Cliente</DialogTitle>
            </DialogHeader>

            <div className="space-y-5 py-1">

              {/* Tipo */}
              <div className="grid grid-cols-2 gap-2">
                {(['normal', 'trial'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => set('clientType', t)}
                    className={cn(
                      'py-2.5 rounded-xl border text-[13px] font-medium transition-colors',
                      state.clientType === t
                        ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                        : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white'
                    )}
                  >
                    {t === 'normal' ? 'Cliente Normal' : 'Teste'}
                  </button>
                ))}
              </div>

              {/* Validade */}
              {state.clientType === 'normal' ? (
                <div>
                  <p className="text-[11px] text-white/40 uppercase tracking-wider mb-2.5 font-semibold">
                    Validade — {state.months} mês{state.months > 1 ? 'es' : ''} ({state.months * 30} dias)
                  </p>
                  <div className="grid grid-cols-6 gap-1.5">
                    {MONTHS.map(m => (
                      <button
                        key={m}
                        onClick={() => set('months', m)}
                        className={cn(
                          'py-2.5 rounded-lg border text-[13px] font-bold transition-colors',
                          state.months === m
                            ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                            : 'border-white/8 text-white/40 hover:border-white/20 hover:text-white/70'
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-[11px] text-white/40 uppercase tracking-wider mb-2.5 font-semibold">Duração do Teste</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {HOURS.map(h => (
                      <button
                        key={h}
                        onClick={() => set('hours', h)}
                        className={cn(
                          'py-2.5 rounded-lg border text-[13px] font-bold transition-colors',
                          state.hours === h
                            ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                            : 'border-white/8 text-white/40 hover:border-white/20 hover:text-white/70'
                        )}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Credenciais */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-white/55 text-[12px]">Usuário</Label>
                  <div className="flex gap-1.5">
                    <Input
                      value={state.username}
                      onChange={e => { set('username', e.target.value); setErrors(p => ({ ...p, username: '' })) }}
                      className="bg-white/5 border-white/10 text-white text-[13px] h-9 font-mono focus-visible:ring-orange-500/40 min-w-0"
                    />
                    <button
                      onClick={() => set('username', genUsername())}
                      title="Gerar novo usuário"
                      className="h-9 w-9 flex-shrink-0 rounded-lg border border-white/10 text-white/35 hover:text-white hover:bg-white/8 transition-colors flex items-center justify-center"
                    >
                      <RefreshCw size={12} />
                    </button>
                  </div>
                  {errors.username && <p className="text-red-400 text-[11px]">{errors.username}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white/55 text-[12px]">Senha</Label>
                  <div className="flex gap-1.5">
                    <div className="relative flex-1 min-w-0">
                      <Input
                        value={state.password}
                        onChange={e => { set('password', e.target.value); setErrors(p => ({ ...p, password: '' })) }}
                        type={state.showPass ? 'text' : 'password'}
                        className="bg-white/5 border-white/10 text-white text-[13px] h-9 pr-8 font-mono focus-visible:ring-orange-500/40"
                      />
                      <button
                        onClick={() => set('showPass', !state.showPass)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                      >
                        {state.showPass ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    </div>
                    <button
                      onClick={() => set('password', genPassword())}
                      title="Gerar nova senha"
                      className="h-9 w-9 flex-shrink-0 rounded-lg border border-white/10 text-white/35 hover:text-white hover:bg-white/8 transition-colors flex items-center justify-center"
                    >
                      <RefreshCw size={12} />
                    </button>
                  </div>
                  {errors.password && <p className="text-red-400 text-[11px]">{errors.password}</p>}
                </div>
              </div>

              {/* Conexões + Pacote */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] text-white/40 uppercase tracking-wider mb-2.5 font-semibold">Conexões</p>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map(n => (
                      <button
                        key={n}
                        onClick={() => set('maxConn', n)}
                        className={cn(
                          'flex-1 py-2 rounded-lg border text-[13px] font-bold transition-colors',
                          state.maxConn === n
                            ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                            : 'border-white/8 text-white/40 hover:border-white/20 hover:text-white/70'
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] text-white/40 uppercase tracking-wider mb-2.5 font-semibold">Pacote</p>
                  <div className="flex gap-1.5">
                    {[
                      { value: '1' as const, label: 'Completo' },
                      { value: '2' as const, label: 'Sem +18' },
                    ].map(b => (
                      <button
                        key={b.value}
                        onClick={() => set('bouquet', b.value)}
                        className={cn(
                          'flex-1 py-2 rounded-lg border text-[11px] font-semibold transition-colors',
                          state.bouquet === b.value
                            ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                            : 'border-white/8 text-white/40 hover:border-white/20 hover:text-white/70'
                        )}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-1">
              <Button variant="ghost" onClick={handleClose} className="flex-1 text-white/50 hover:text-white">
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
              >
                {loading ? 'Criando...' : state.clientType === 'trial' ? 'Criar Teste' : 'Criar Cliente'}
              </Button>
            </div>
          </>
        )}

        {/* ──── STEP 2: RESULT ──── */}
        {step === 'result' && result && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-400">
                <CheckCircle2 size={20} />
                {result.type === 'trial' ? 'Teste Criado!' : 'Cliente Criado!'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-1">
              {/* Credenciais */}
              <div className="bg-white/4 border border-white/8 rounded-xl p-4 space-y-3">
                <p className="text-[10px] text-white/35 uppercase tracking-widest font-semibold">Credenciais</p>
                {[
                  { label: 'Usuário', value: result.username },
                  { label: 'Senha', value: result.password },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] text-white/40">{label}</p>
                      <p className="font-mono text-[14px] text-white font-semibold truncate">{value}</p>
                    </div>
                    <button
                      onClick={() => copy(value, label)}
                      className="flex-shrink-0 text-white/30 hover:text-white/70 p-1.5 rounded-lg hover:bg-white/8 transition-colors"
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

              {/* Xtream Codes */}
              <div className="bg-white/4 border border-white/8 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-white/35 uppercase tracking-widest font-semibold mb-2">Xtream Codes</p>
                    <div className="space-y-1 text-[12px]">
                      <p><span className="text-white/40">Host: </span><span className="font-mono text-white/65">{XUI_HOST.replace(/^https?:\/\//, '')}</span></p>
                      <p><span className="text-white/40">Porta: </span><span className="font-mono text-white/65">{XUI_PORT}</span></p>
                      <p><span className="text-white/40">Usuário: </span><span className="font-mono text-white/65">{result.username}</span></p>
                      <p><span className="text-white/40">Senha: </span><span className="font-mono text-white/65">{result.password}</span></p>
                    </div>
                  </div>
                  <button
                    onClick={() => copy(
                      `Host: ${XUI_HOST.replace(/^https?:\/\//, '')}\nPorta: ${XUI_PORT}\nUsuário: ${result.username}\nSenha: ${result.password}`,
                      'Dados Xtream'
                    )}
                    className="flex-shrink-0 mt-0.5 text-white/30 hover:text-white/70 p-1.5 rounded-lg hover:bg-white/8 transition-colors"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              <p className="text-[12px] text-white/35 px-1">
                Validade: <span className="text-white/55 font-medium">{result.durationLabel}</span>
              </p>
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
