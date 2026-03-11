import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { cacheDel } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const [fullUser, history, children] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { credits: true },
    }),
    prisma.creditLog.findMany({
      where: { OR: [{ fromUserId: user.id }, { toUserId: user.id }] },
      include: {
        fromUser: { select: { username: true } },
        toUser: { select: { username: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.user.findMany({
      where: { parentId: user.id },
      select: { id: true, username: true, role: true, credits: true, status: true },
      orderBy: { username: 'asc' },
    }),
  ])

  return NextResponse.json({
    balance: Number(fullUser?.credits ?? 0),
    history,
    children: children.map(c => ({ ...c, credits: Number(c.credits) })),
  })
}

const transferSchema = z.object({
  toUserId: z.string().min(1),
  amount: z.number().positive().max(999999),
  comment: z.string().min(3).max(300),
  type: z.enum(['TRANSFERENCIA', 'BONUS', 'ESTORNO']).default('TRANSFERENCIA'),
})

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = transferSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const { toUserId, amount, comment, type } = parsed.data

  const [toUser, fromUser] = await Promise.all([
    prisma.user.findUnique({
      where: { id: toUserId },
      select: { id: true, username: true, parentId: true, credits: true, status: true },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { credits: true },
    }),
  ])

  if (!toUser) return NextResponse.json({ error: 'Destinatário não encontrado' }, { status: 404 })
  if (!fromUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  if (user.role !== 'ADMIN' && toUser.parentId !== user.id) {
    return NextResponse.json({ error: 'Só pode transferir para usuários sob sua hierarquia direta' }, { status: 403 })
  }

  if (user.role !== 'ADMIN' && Number(fromUser.credits) < amount) {
    return NextResponse.json({
      error: `Saldo insuficiente. Você tem ${Number(fromUser.credits).toFixed(0)} crédito(s).`,
    }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for') || undefined

  await prisma.$transaction(async (tx) => {
    if (user.role !== 'ADMIN') {
      await tx.user.update({ where: { id: user.id }, data: { credits: { decrement: amount } } })
    }
    await tx.user.update({ where: { id: toUserId }, data: { credits: { increment: amount } } })
    await tx.creditLog.create({
      data: {
        fromUserId: user.id,
        toUserId,
        amount,
        type,
        comment,
        balanceBefore: Number(fromUser.credits),
        balanceAfter: user.role === 'ADMIN' ? Number(fromUser.credits) : Number(fromUser.credits) - amount,
      },
    })
  })

  await audit({
    userId: user.id,
    action: 'CREDIT_TRANSFERRED',
    entityType: 'USER',
    entityId: toUserId,
    dataAfter: { amount, comment, type, to: toUser.username },
    ipAddress: ip,
  })

  await cacheDel(`dashboard:stats:${user.id}`)

  return NextResponse.json({
    success: true,
    message: `${amount} crédito(s) transferido(s) para ${toUser.username}`,
  })
}
