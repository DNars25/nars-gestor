'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import {
  LayoutDashboard,
  Users,
  Network,
  CreditCard,
  Activity,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Tv,
  Shield,
  Bell,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  roles: string[]
  badge?: string
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard size={20} />,
    roles: ['ADMIN', 'INVESTIDOR', 'MASTER', 'REVENDA'],
  },
  {
    label: 'Clientes',
    href: '/clientes',
    icon: <Users size={20} />,
    roles: ['ADMIN', 'MASTER', 'REVENDA'],
  },
  {
    label: 'Conexões Ativas',
    href: '/conexoes',
    icon: <Activity size={20} />,
    roles: ['ADMIN', 'MASTER', 'REVENDA'],
  },
  {
    label: 'Rede',
    href: '/rede',
    icon: <Network size={20} />,
    roles: ['ADMIN', 'INVESTIDOR', 'MASTER'],
  },
  {
    label: 'Créditos',
    href: '/creditos',
    icon: <CreditCard size={20} />,
    roles: ['ADMIN', 'INVESTIDOR', 'MASTER', 'REVENDA'],
  },
  {
    label: 'Anti-Fraude',
    href: '/anti-fraude',
    icon: <Shield size={20} />,
    roles: ['ADMIN', 'INVESTIDOR'],
  },
  {
    label: 'Novidades',
    href: '/novidades',
    icon: <Bell size={20} />,
    roles: ['ADMIN', 'INVESTIDOR', 'MASTER', 'REVENDA'],
  },
  {
    label: 'Configurações',
    href: '/configuracoes',
    icon: <Settings size={20} />,
    roles: ['ADMIN'],
  },
]

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
        'relative flex flex-col h-screen bg-[#0F1014] border-r border-white/10 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
          <Tv size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-white text-sm leading-none">NARS</p>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">IPTV Manager</p>
          </div>
        )}
      </div>

      {/* User info */}
      {!collapsed && user && (
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-xs text-white/40 uppercase tracking-wider">Logado como</p>
          <p className="text-sm font-medium text-white truncate">{user.username}</p>
          <Badge variant="outline" className="mt-1 text-[10px] border-orange-500/50 text-orange-400">
            {user.role}
          </Badge>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {filtered.map(item => {
            const isActive = pathname.startsWith(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-orange-500/20 text-orange-400 font-medium'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && (
                    <span className="flex-1">{item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <Badge className="bg-orange-500 text-white text-[10px]">{item.badge}</Badge>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <Separator className="bg-white/10" />

      {/* Logout */}
      <div className="p-2">
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-colors',
          )}
        >
          <LogOut size={20} />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#1a1d24] border border-white/20 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}
