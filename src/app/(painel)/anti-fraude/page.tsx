'use client'

import { Shield, Lock, AlertTriangle, Eye, Ban, CheckCircle } from 'lucide-react'

const features = [
  { icon: <Eye size={18} />, text: 'Detecta mesmo IP acessando contas diferentes' },
  { icon: <AlertTriangle size={18} />, text: 'Análise de fingerprint e User-Agent' },
  { icon: <Ban size={18} />, text: 'Bloqueio automático de fraudes confirmadas' },
  { icon: <CheckCircle size={18} />, text: 'Notificação por Telegram ao Admin' },
]

export default function AntiFraudePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Anti-Fraude</h1>
        <p className="text-white/40 text-[14px] mt-1">Detecção de painel duplo e uso indevido</p>
      </div>

      <div className="max-w-2xl">
        <div className="relative rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent overflow-hidden p-8">
          {/* Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center mb-6">
              <Shield size={32} className="text-orange-400" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/25 text-orange-400 text-[12px] font-semibold mb-4">
              <Lock size={11} />
              DISPONÍVEL NA FASE 2
            </div>

            <h2 className="text-xl font-bold text-white mb-3">Sistema Anti-Fraude Inteligente</h2>
            <p className="text-white/50 text-[14px] leading-relaxed mb-6">
              Módulo avançado de detecção de painel duplo e uso indevido de contas.
              Será lançado na Fase 2 junto com o gateway de pagamentos e auditoria completa.
            </p>

            <div className="space-y-3">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-white/50">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 text-white/30">
                    {f.icon}
                  </div>
                  <span className="text-[14px]">{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
