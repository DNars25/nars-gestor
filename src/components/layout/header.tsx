'use client'

import { useAuthStore } from '@/store/auth.store'
import { Bell, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function Header() {
  const { user } = useAuthStore()

  return (
    <header className="h-16 border-b border-white/8 bg-[#0d0f14] flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-4 flex-1 max-w-lg">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <Input
            placeholder="Buscar cliente, revenda, master..."
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/25 h-10 text-[14px] focus-visible:ring-orange-500/40 focus-visible:border-orange-500/30 rounded-xl"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative w-10 h-10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/6 rounded-xl transition-all border border-transparent hover:border-white/10">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-[#0d0f14]" />
        </button>

        <div className="flex items-center gap-3 pl-3 border-l border-white/10">
          <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
            <span className="text-sm font-bold text-orange-400">
              {user?.username?.slice(0, 2).toUpperCase() || 'NA'}
            </span>
          </div>
          {user && (
            <div className="hidden sm:block">
              <p className="text-[13px] font-semibold text-white leading-tight">{user.username}</p>
              <p className="text-[11px] text-white/40">{user.role}</p>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
