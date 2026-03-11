import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cacheGet, cacheSet } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'INVESTIDOR', 'MASTER'].includes(user.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const cacheKey = `rede:revendas:${user.id}`
  const cached = await cacheGet(cacheKey)
  if (cached) return NextResponse.json(cached)

  const where = user.role === 'MASTER'
    ? { role: 'REVENDA' as const, parentId: user.id }
    : { role: 'REVENDA' as const }

  const revendas = await prisma.user.findMany({
    where,
    select: {
      id: true,
      username: true,
      status: true,
      credits: true,
      createdAt: true,
      lastLoginAt: true,
      parent: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const result = revendas.map(r => ({
    id: r.id,
    username: r.username,
    status: r.status,
    credits: Number(r.credits),
    createdAt: r.createdAt,
    lastLoginAt: r.lastLoginAt,
    master: r.parent ? { id: r.parent.id, username: r.parent.username } : null,
  }))

  await cacheSet(cacheKey, result, 30)
  return NextResponse.json(result)
}
