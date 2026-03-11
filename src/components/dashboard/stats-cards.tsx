'use client'

import { Users, Wifi, Clock, AlertTriangle, Network, TrendingUp, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCard {
  title: string
  value: number | string
  icon: React.ReactNode
  gradient: string
  iconBg: string
  description?: string
}

interface StatsCardsProps {
  stats: {
    totalClients: number
    activeClients: number
    trialClients: number
    onlineNow: number
    expiringClients: number
    mastersCount: number
    revendasCount: number
  } | null
  isLoading: boolean
}

function StatCard({ title, value, icon, gradient, iconBg, description }: StatCard) {
  return (
    <div className={cn(
      'relative rounded-2xl p-6 border overflow-hidden transition-all duration-200 hover:scale-[1.01]',
      'bg-[#13161d] border-white/8 hover:border-white/15'
    )}>
      {/* Subtle gradient glow */}
      <div className={cn('absolute inset-0 opacity-5', gradient)} />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-white/45 uppercase tracking-widest mb-3">{title}</p>
          <p className="text-4xl font-bold text-white leading-none mb-2">
            {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
          </p>
          {description && (
            <p className="text-[13px] text-white/35 mt-1">{description}</p>
          )}
        </div>
        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0', iconBg)}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl p-6 bg-[#13161d] border border-white/8 animate-pulse">
      <div className="h-3 bg-white/10 rounded w-20 mb-4" />
      <div className="h-10 bg-white/10 rounded w-24 mb-3" />
      <div className="h-3 bg-white/10 rounded w-16" />
    </div>
  )
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  const cards: StatCard[] = [
    {
      title: 'Online Agora',
      value: stats?.onlineNow ?? 0,
      icon: <Wifi size={22} className="text-green-400" />,
      gradient: 'bg-gradient-to-br from-green-500 to-emerald-600',
      iconBg: 'bg-green-500/15 border border-green-500/20',
      description: 'nos últimos 5 min',
    },
    {
      title: 'Total de Clientes',
      value: stats?.totalClients ?? 0,
      icon: <Users size={22} className="text-blue-400" />,
      gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      iconBg: 'bg-blue-500/15 border border-blue-500/20',
    },
    {
      title: 'Clientes Ativos',
      value: stats?.activeClients ?? 0,
      icon: <TrendingUp size={22} className="text-emerald-400" />,
      gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-500/15 border border-emerald-500/20',
    },
    {
      title: 'Em Teste',
      value: stats?.trialClients ?? 0,
      icon: <Clock size={22} className="text-yellow-400" />,
      gradient: 'bg-gradient-to-br from-yellow-500 to-amber-600',
      iconBg: 'bg-yellow-500/15 border border-yellow-500/20',
    },
    {
      title: 'Expirando em 7d',
      value: stats?.expiringClients ?? 0,
      icon: <AlertTriangle size={22} className="text-orange-400" />,
      gradient: 'bg-gradient-to-br from-orange-500 to-red-600',
      iconBg: 'bg-orange-500/15 border border-orange-500/20',
      description: 'renovação necessária',
    },
    {
      title: 'Masters',
      value: stats?.mastersCount ?? 0,
      icon: <Network size={22} className="text-purple-400" />,
      gradient: 'bg-gradient-to-br from-purple-500 to-violet-600',
      iconBg: 'bg-purple-500/15 border border-purple-500/20',
      description: 'ativos na rede',
    },
    {
      title: 'Revendas',
      value: stats?.revendasCount ?? 0,
      icon: <ShoppingBag size={22} className="text-pink-400" />,
      gradient: 'bg-gradient-to-br from-pink-500 to-rose-600',
      iconBg: 'bg-pink-500/15 border border-pink-500/20',
      description: 'ativas na rede',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
      {cards.map(card => <StatCard key={card.title} {...card} />)}
    </div>
  )
}
