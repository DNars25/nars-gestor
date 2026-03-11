import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { xuiQuery } from '@/lib/xui-db'
import { xuiApi } from '@/lib/xui-api'
import { audit } from '@/lib/audit'
import type { XuiLine } from '@/lib/xui-db'

const renewSchema = z.object({
  months: z.number().int().min(1).max(12).default(1),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const clientId = parseInt(id)

  const body = await req.json().catch(() => ({ months: 1 }))
  const parsed = renewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { months } = parsed.data

  const clients = await xuiQuery<XuiLine>('SELECT * FROM lines WHERE id = ? AND admin_enabled = 1', [clientId])
  if (clients.length === 0) {
    return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  }

  const client = clients[0]

  const nowSec = Math.floor(Date.now() / 1000)
  // Se já expirou, começa da data atual; exp_date é Unix segundos
  const baseDate = client.exp_date && client.exp_date > nowSec
    ? client.exp_date
    : nowSec

  const newExpDate = baseDate + months * 30 * 24 * 60 * 60

  try {
    await xuiApi.renewUser(clientId, newExpDate)

    await audit({
      userId: user.id,
      action: 'CLIENT_RENEWED',
      entityType: 'CLIENT',
      entityId: String(clientId),
      dataBefore: { exp_date: client.exp_date },
      dataAfter: { exp_date: newExpDate, months },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({
      success: true,
      message: `${client.username} renovado por ${months} mês(es)`,
      newExpDate,
    })
  } catch (err) {
    console.error('Error renewing client:', err)
    return NextResponse.json({ error: 'Erro ao renovar cliente' }, { status: 500 })
  }
}
