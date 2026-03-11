'use client'

import { Users, Wifi, Clock, AlertTriangle, Network, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCard {
  title: string
  value: number | string
  icon: React.ReactNode
  color: string
  bgColor: string
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

function StatCard({ title, value, icon, color, bgColor, description }: StatCard) {
  return (
    <Card className="bg-[#13161d] border-white/10 hover:border-white/20 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider">{title}</p>
            <p className={cn('text-3xl font-bold mt-1', color)}>
              {value}
            </p>
            {description && (
              <p className="text-xs text-white/40 mt-1">{description}</p>
            )}
          </div>
          <div className={cn('p-2.5 rounded-xl', bgColor)}>
            <span className={color}>{icon}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SkeletonCard() {
  return (
    <Card className="bg-[#13161d] border-white/10">
      <CardContent className="p-5">
        <div className="animate-pulse">
          <div className="h-3 bg-white/10 rounded w-24 mb-3" />
          <div className="h-8 bg-white/10 rounded w-16 mb-2" />
          <div className="h-3 bg-white/10 rounded w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  const cards: StatCard[] = [
    {
      title: 'Online Agora',
      value: stats?.onlineNow || 0,
      icon: <Wifi size={20} />,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      description: 'nos últimos 5 min',
    },
    {
      title: 'Total de Clientes',
      value: stats?.totalClients || 0,
      icon: <Users size={20} />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Clientes Ativos',
      value: stats?.activeClients || 0,
      icon: <TrendingUp size={20} />,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Em Teste',
      value: stats?.trialClients || 0,
      icon: <Clock size={20} />,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Expirando em 7d',
      value: stats?.expiringClients || 0,
      icon: <AlertTriangle size={20} />,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      description: 'requer renovação',
    },
    {
      title: 'Masters',
      value: stats?.mastersCount || 0,
      icon: <Network size={20} />,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      description: 'ativos',
    },
    {
      title: 'Revendas',
      value: stats?.revendasCount || 0,
      icon: <Network size={20} />,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
      description: 'ativas',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {cards.map(card => <StatCard key={card.title} {...card} />)}
    </div>
  )
}
