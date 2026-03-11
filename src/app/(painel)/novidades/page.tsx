'use client'

import { Bell, Tv, Film, Cpu, RefreshCw } from 'lucide-react'

const features = [
  { icon: <Tv size={18} />, text: 'Detecção automática de novos canais ao vivo' },
  { icon: <Film size={18} />, text: 'Alertas de novos filmes e séries adicionados' },
  { icon: <Bell size={18} />, text: 'Notificação push via PWA e Telegram' },
  { icon: <RefreshCw size={18} />, text: 'Varredura automática a cada 30 minutos' },
]

export default function NovidadesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Novidades</h1>
        <p className="text-white/40 text-[14px] mt-1">Detecção automática de novos conteúdos no servidor</p>
      </div>

      <div className="max-w-2xl">
        <div className="relative rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent overflow-hidden p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center mb-6">
              <Cpu size={32} className="text-purple-400" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/25 text-purple-400 text-[12px] font-semibold mb-4">
              <Bell size={11} />
              DISPONÍVEL NA FASE 3
            </div>

            <h2 className="text-xl font-bold text-white mb-3">Monitor de Novidades Automático</h2>
            <p className="text-white/50 text-[14px] leading-relaxed mb-6">
              Sistema inteligente que monitora o banco XUI em tempo real e notifica masters e revendas
              sobre novos conteúdos adicionados ao servidor. Fase 3 junto com PWA completo e relatórios.
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
