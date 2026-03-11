'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import {
  LayoutDashboard, Users, Network, CreditCard, Activity,
  Settings, LogOut, ChevronLeft, ChevronRight, Tv,
  Shield, Bell,
} from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  roles: string[]
  phase?: string
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard size={18} />,
    roles: ['ADMIN', 'INVESTIDOR', 'MASTER', 'REVENDA'],
  },
  {
    label: 'Clientes',
    href: '/clientes',
    icon: <Users size={18} />,
    roles: ['ADMIN', 'MASTER', 'REVENDA'],
  },
  {
    label: 'Conexões Ativas',
    href: '/conexoes',
    icon: <Activity size={18} />,
    roles: ['ADMIN', 'MASTER', 'REVENDA'],
  },
  {
    label: 'Rede',
    href: '/rede',
    icon: <Network size={18} />,
    roles: ['ADMIN', 'INVESTIDOR', 'MASTER'],
  },
  {
    label: 'Créditos',
    href: '/creditos',
    icon: <CreditCard size={18} />,
    roles: ['ADMIN', 'INVESTIDOR', 'MASTER', 'REVENDA'],
  },
  {
    label: 'Anti-Fraude',
    href: '/anti-fraude',
    icon: <Shield size={18} />,
    roles: ['ADMIN', 'INVESTIDOR'],
    phase: 'Fase 2',
  },
  {
    label: 'Novidades',
    href: '/novidades',
    icon: <Bell size={18} />,
    roles: ['ADMIN', 'INVESTIDOR', 'MASTER', 'REVENDA'],
    phase: 'Fase 3',
  },
  {
    label: 'Configurações',
    href: '/configuracoes',
    icon: <Settings size={18} />,
    roles: ['ADMIN'],
  },
]

const roleColors: Record<string, string> = {
  ADMIN: 'border-red-500/40 text-red-400 bg-red-500/10',
  INVESTIDOR: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
  MASTER: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
  REVENDA: 'border-green-500/40 text-green-400 bg-green-500/10',
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, clearAuth } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)

  const filtered = navItems.filter(item => user?.role && item.roles.includes(user.role))

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    clearAuth()
    window.location.href = '/login'
  }

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen bg-[#0d0f14] border-r border-white/8 transition-all duration-300 flex-shrink-0',
        collapsed ? 'w-[70px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/8">
        <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Tv size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-white text-base leading-tight tracking-wide">NARS</p>
            <p className="text-[11px] text-white/35 uppercase tracking-widest font-medium">IPTV Manager</p>
          </div>
        )}
      </div>

      {/* User info */}
      {!collapsed && user && (
        <div className="px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-orange-400">
                {user.username.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight">{user.username}</p>
              <span className={cn(
                'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border mt-0.5',
                roleColors[user.role] || 'border-white/20 text-white/50'
              )}>
                {user.role}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <ul className="space-y-0.5 px-3">
          {filtered.map(item => {
            const isActive = pathname.startsWith(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-xl text-[14px] font-medium transition-all duration-150',
                    isActive
                      ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
                      : 'text-white/55 hover:text-white hover:bg-white/6 border border-transparent'
                  )}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {item.phase && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/8 text-white/35 border border-white/10">
                          {item.phase}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <Separator className="bg-white/8" />

      {/* Logout */}
      <div className="p-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-[14px] font-medium text-white/45 hover:text-red-400 hover:bg-red-500/8 border border-transparent transition-all duration-150"
        >
          <LogOut size={18} />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-8 w-7 h-7 bg-[#1a1d26] border border-white/15 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 transition-all shadow-lg"
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>
    </aside>
  )
}
