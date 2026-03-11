import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cacheGet, cacheSet } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'INVESTIDOR'].includes(user.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const cacheKey = `rede:masters:${user.id}`
  const cached = await cacheGet(cacheKey)
  if (cached) return NextResponse.json(cached)

  const masters = await prisma.user.findMany({
    where: { role: 'MASTER' },
    select: {
      id: true,
      username: true,
      status: true,
      credits: true,
      createdAt: true,
      lastLoginAt: true,
      parent: { select: { username: true } },
      _count: { select: { children: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const result = masters.map(m => ({
    id: m.id,
    username: m.username,
    status: m.status,
    credits: Number(m.credits),
    createdAt: m.createdAt,
    lastLoginAt: m.lastLoginAt,
    investidor: m.parent?.username ?? null,
    revendasCount: m._count.children,
  }))

  await cacheSet(cacheKey, result, 30)
  return NextResponse.json(result)
}
