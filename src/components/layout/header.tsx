'use client'

import { useAuthStore } from '@/store/auth.store'
import { Bell, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function Header() {
  const { user } = useAuthStore()

  return (
    <header className="h-14 border-b border-white/10 bg-[#0F1014] flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <Input
            placeholder="Buscar cliente, revenda..."
            className="pl-8 bg-white/5 border-white/10 text-white placeholder:text-white/30 h-8 text-sm focus-visible:ring-orange-500/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative w-8 h-8 flex items-center justify-center text-white/50 hover:text-white transition-colors">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-orange-500/20 text-orange-400 text-xs font-bold">
              {user?.username?.slice(0, 2).toUpperCase() || 'NA'}
            </AvatarFallback>
          </Avatar>
          {user && (
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-white leading-none">{user.username}</p>
              <Badge variant="outline" className="text-[9px] mt-0.5 border-orange-500/30 text-orange-400/80 px-1 py-0">
                {user.role}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
