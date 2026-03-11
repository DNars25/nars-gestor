'use client'

import { Network } from 'lucide-react'

export default function RedePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Rede</h1>
        <p className="text-white/40 text-sm">Gestão de Masters e Revendas</p>
      </div>
      <div className="flex items-center justify-center py-24 text-white/20">
        <div className="text-center">
          <Network size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Em desenvolvimento</p>
          <p className="text-sm mt-1">Módulo de Rede — Fase 1</p>
        </div>
      </div>
    </div>
  )
}
