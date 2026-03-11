import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const configs = await prisma.systemConfig.findMany()
  const map: Record<string, string> = {}
  for (const c of configs) {
    map[c.key] = c.value
  }
  return NextResponse.json(map)
}

const configSchema = z.record(z.string(), z.string())

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = configSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  await Promise.all(
    Object.entries(parsed.data).map(([key, value]) =>
      prisma.systemConfig.upsert({
        where: { key },
        update: { value, updatedBy: user.id },
        create: { key, value, updatedBy: user.id },
      })
    )
  )

  return NextResponse.json({ success: true, message: 'Configurações salvas!' })
}
