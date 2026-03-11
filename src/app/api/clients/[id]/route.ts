import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { xuiQuery } from '@/lib/xui-db'
import { xuiApi } from '@/lib/xui-api'
import { audit } from '@/lib/audit'
import type { XuiLine } from '@/lib/xui-db'

const updateSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  password: z.string().min(4).max(100).optional(),
  expDays: z.number().int().optional(),
  expDate: z.number().optional(), // timestamp direto
  maxConnections: z.number().int().min(1).max(10).optional(),
  bouquet: z.string().optional(),
  enabled: z.boolean().optional(),
})

// GET - Detalhes de um cliente
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const clientId = parseInt(id)

  const clients = await xuiQuery<XuiLine>(
    `SELECT id, username, password, exp_date, enabled, admin_enabled, member_id,
            created_at, max_connections, is_trial, bouquet, admin_notes, reseller_notes, contact
     FROM lines WHERE id = ? AND admin_enabled = 1`,
    [clientId]
  )

  if (clients.length === 0) {
    return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  }

  return NextResponse.json(clients[0])
}

// PATCH - Atualizar cliente
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const clientId = parseInt(id)

  const body = await req.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  // Buscar estado atual para o audit
  const [before] = await xuiQuery<XuiLine>('SELECT * FROM lines WHERE id = ?', [clientId])
  if (!before) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  const updatePayload: Record<string, unknown> = { id: clientId }

  if (data.username !== undefined) updatePayload.username = data.username
  if (data.password !== undefined) updatePayload.password = data.password
  if (data.expDate !== undefined) updatePayload.exp_date = Math.floor(data.expDate / 1000)
  if (data.expDays !== undefined) updatePayload.exp_date = Math.floor(Date.now() / 1000) + data.expDays * 24 * 60 * 60
  if (data.maxConnections !== undefined) updatePayload.max_connections = data.maxConnections
  if (data.bouquet !== undefined) updatePayload.bouquet = data.bouquet
  if (data.enabled !== undefined) updatePayload.enabled = data.enabled ? 1 : 0

  try {
    await xuiApi.updateUser(updatePayload as unknown as Parameters<typeof xuiApi.updateUser>[0])

    await audit({
      userId: user.id,
      action: 'CLIENT_UPDATED',
      entityType: 'CLIENT',
      entityId: String(clientId),
      dataBefore: before,
      dataAfter: updatePayload,
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error updating client:', err)
    return NextResponse.json({ error: 'Erro ao atualizar cliente' }, { status: 500 })
  }
}

// DELETE - Deletar cliente
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'MASTER'].includes(user.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { id } = await params
  const clientId = parseInt(id)

  const [before] = await xuiQuery<XuiLine>('SELECT * FROM lines WHERE id = ?', [clientId])
  if (!before) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  try {
    await xuiApi.deleteUser(clientId)

    await audit({
      userId: user.id,
      action: 'CLIENT_DELETED',
      entityType: 'CLIENT',
      entityId: String(clientId),
      dataBefore: before,
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error deleting client:', err)
    return NextResponse.json({ error: 'Erro ao deletar cliente' }, { status: 500 })
  }
}
