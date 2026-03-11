'use client'

import { useState, useEffect } from 'react'
import { useApi } from '@/hooks/use-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Settings, Globe, Link2, MessageSquare, BookOpen, DollarSign, Save, RefreshCw } from 'lucide-react'

interface SysConfig {
  server_dns?: string
  server_international_dns?: string
  smarters_url?: string
  smarters_code?: string
  telegram_channel?: string
  expiring_alert_days?: string
  trial_duration_hours?: string
  system_rules?: string
  commercial_rules?: string
  price_table?: string
}

export default function ConfiguracoesPage() {
  const { request } = useApi()
  const [config, setConfig] = useState<SysConfig>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function fetchConfig() {
    setLoading(true)
    try {
      const data = await request<SysConfig>('/api/configuracoes')
      setConfig(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchConfig() }, [])

  function update(key: keyof SysConfig, value: string) {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await request<{ message: string }>('/api/configuracoes', {
        method: 'PUT',
        body: JSON.stringify(config),
      })
      toast.success(res.message)
    } catch (err) {
      toast.error(String(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Configurações</h1>
          <p className="text-white/40 text-[14px] mt-1">Configurações globais do sistema</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 bg-white/4 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Settings size={22} className="text-orange-400" />
            Configurações
          </h1>
          <p className="text-white/40 text-[14px] mt-1">Configurações globais exibidas no dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchConfig}
            variant="ghost"
            className="h-10 w-10 p-0 text-white/40 hover:text-white rounded-xl"
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-orange-500 hover:bg-orange-600 text-white gap-2 h-10 px-5 text-[13px] font-semibold rounded-xl shadow-lg shadow-orange-500/20"
          >
            <Save size={15} />
            {saving ? 'Salvando...' : 'Salvar Tudo'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Servidor / DNS */}
        <Card className="bg-[#13161d] border-white/8">
          <CardHeader className="pb-4">
            <CardTitle className="text-[15px] font-bold text-white flex items-center gap-2">
              <Globe size={15} className="text-blue-400" />
              Servidor & DNS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[13px] text-white/60">DNS / IP do Servidor</Label>
              <Input
                value={config.server_dns ?? ''}
                onChange={e => update('server_dns', e.target.value)}
                placeholder="149.248.46.167"
                className="bg-white/5 border-white/10 text-white h-11 rounded-xl text-[14px] focus-visible:ring-orange-500/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] text-white/60">DNS Internacional</Label>
              <Input
                value={config.server_international_dns ?? ''}
                onChange={e => update('server_international_dns', e.target.value)}
                placeholder="meuservidor.com.br"
                className="bg-white/5 border-white/10 text-white h-11 rounded-xl text-[14px] focus-visible:ring-orange-500/40"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[13px] text-white/60">Alerta expiração (dias)</Label>
                <Input
                  value={config.expiring_alert_days ?? '7'}
                  onChange={e => update('expiring_alert_days', e.target.value)}
                  type="number"
                  min={1}
                  max={30}
                  className="bg-white/5 border-white/10 text-white h-11 rounded-xl text-[14px] focus-visible:ring-orange-500/40"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] text-white/60">Duração de Teste (horas)</Label>
                <Input
                  value={config.trial_duration_hours ?? '24'}
                  onChange={e => update('trial_duration_hours', e.target.value)}
                  type="number"
                  min={1}
                  max={72}
                  className="bg-white/5 border-white/10 text-white h-11 rounded-xl text-[14px] focus-visible:ring-orange-500/40"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Apps & Links */}
        <Card className="bg-[#13161d] border-white/8">
          <CardHeader className="pb-4">
            <CardTitle className="text-[15px] font-bold text-white flex items-center gap-2">
              <Link2 size={15} className="text-purple-400" />
              Aplicativos & Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[13px] text-white/60">URL Smarters Player</Label>
              <Input
                value={config.smarters_url ?? ''}
                onChange={e => update('smarters_url', e.target.value)}
                placeholder="http://149.248.46.167:80/smarters"
                className="bg-white/5 border-white/10 text-white h-11 rounded-xl text-[14px] focus-visible:ring-orange-500/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] text-white/60">Código Purple / Xtream</Label>
              <Input
                value={config.smarters_code ?? ''}
                onChange={e => update('smarters_code', e.target.value)}
                placeholder="ABCD1234"
                className="bg-white/5 border-white/10 text-white h-11 rounded-xl text-[14px] focus-visible:ring-orange-500/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] text-white/60 flex items-center gap-1.5">
                <MessageSquare size={12} />
                Canal Telegram / WhatsApp
              </Label>
              <Input
                value={config.telegram_channel ?? ''}
                onChange={e => update('telegram_channel', e.target.value)}
                placeholder="https://t.me/seucanalsuporte"
                className="bg-white/5 border-white/10 text-white h-11 rounded-xl text-[14px] focus-visible:ring-orange-500/40"
              />
            </div>
          </CardContent>
        </Card>

        {/* Regras do Servidor */}
        <Card className="bg-[#13161d] border-white/8">
          <CardHeader className="pb-4">
            <CardTitle className="text-[15px] font-bold text-white flex items-center gap-2">
              <BookOpen size={15} className="text-green-400" />
              Regras do Servidor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={config.system_rules ?? ''}
              onChange={e => update('system_rules', e.target.value)}
              placeholder="Digite as regras do servidor que aparecerão no dashboard..."
              rows={7}
              className="bg-white/5 border-white/10 text-white rounded-xl text-[14px] resize-none focus-visible:ring-orange-500/40 placeholder:text-white/25 leading-relaxed"
            />
          </CardContent>
        </Card>

        {/* Regras Comerciais */}
        <Card className="bg-[#13161d] border-white/8">
          <CardHeader className="pb-4">
            <CardTitle className="text-[15px] font-bold text-white flex items-center gap-2">
              <DollarSign size={15} className="text-orange-400" />
              Regras de Comercialização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={config.commercial_rules ?? ''}
              onChange={e => update('commercial_rules', e.target.value)}
              placeholder="Ex: 1 crédito = R$ 25,00 por mês&#10;Pacote trimestral: 3 meses por R$ 60&#10;..."
              rows={7}
              className="bg-white/5 border-white/10 text-white rounded-xl text-[14px] resize-none focus-visible:ring-orange-500/40 placeholder:text-white/25 leading-relaxed"
            />
          </CardContent>
        </Card>
      </div>

      {/* Salvar */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-orange-500 hover:bg-orange-600 text-white gap-2 h-11 px-8 text-[14px] font-semibold rounded-xl shadow-lg shadow-orange-500/20"
        >
          <Save size={16} />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  )
}
