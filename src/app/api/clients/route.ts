import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { xuiQuery } from '@/lib/xui-db'
import { xuiApi } from '@/lib/xui-api'
import { audit } from '@/lib/audit'
import { cacheGet, cacheSet, cacheDel } from '@/lib/redis'
import type { XuiLine } from '@/lib/xui-db'

export const dynamic = 'force-dynamic'

const createClientSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(4).max(100),
  expDays: z.number().int().min(1).max(365),
  bouquet: z.string().default('1'),
  maxConnections: z.number().int().min(1).max(10).default(1),
  isTrial: z.boolean().default(false),
})

// GET - Listar clientes
export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '50')
  const search = url.searchParams.get('search') || ''
  const status = url.searchParams.get('status') || 'all'

  const offset = (page - 1) * limit
  const cacheKey = `clients:list:${user.id}:${page}:${limit}:${search}:${status}`

  const cached = await cacheGet(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    let whereClause = 'WHERE admin_enabled = 1'
    const params: (string | number | boolean | null)[] = []

    // Filtro por reseller para não-admins
    // (Admin vê todos; Master/Revenda veem apenas seus clientes via reseller_id do XUI)
    // Simplificado para MVP: admin vê tudo

    if (search) {
      whereClause += ' AND username LIKE ?'
      params.push(`%${search}%`)
    }

    const nowSec = Math.floor(Date.now() / 1000)
    if (status === 'active') {
      whereClause += ' AND enabled = 1 AND (exp_date = 0 OR exp_date > ?)'
      params.push(nowSec)
    } else if (status === 'expired') {
      whereClause += ' AND exp_date > 0 AND exp_date < ?'
      params.push(nowSec)
    } else if (status === 'blocked') {
      whereClause += ' AND enabled = 0'
    } else if (status === 'trial') {
      whereClause += ' AND is_trial = 1'
    }

    const [countResult] = await xuiQuery<{ total: number }>(
      `SELECT COUNT(*) as total FROM \`lines\` ${whereClause}`,
      params
    )

    const clients = await xuiQuery<XuiLine>(
      `SELECT id, username, password, exp_date, enabled, admin_enabled, member_id,
              created_at, max_connections, is_trial, bouquet, admin_notes, reseller_notes, contact
       FROM \`lines\` ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )

    const result = {
      clients,
      total: countResult.total,
      page,
      limit,
      pages: Math.ceil(countResult.total / limit),
    }

    await cacheSet(cacheKey, result, 30)
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[/api/clients GET] Erro:', msg)
    return NextResponse.json({ error: 'Erro ao buscar clientes', detail: msg }, { status: 500 })
  }
}

// POST - Criar cliente
export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'MASTER', 'REVENDA'].includes(user.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = createClientSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const { username, password, expDays, bouquet, maxConnections, isTrial } = parsed.data

  // Verificar se username já existe no XUI
  const existing = await xuiQuery<XuiLine>('SELECT id FROM `lines` WHERE username = ?', [username])
  if (existing.length > 0) {
    return NextResponse.json({ error: 'Nome de usuário já existe' }, { status: 409 })
  }

  const expDate = Math.floor(Date.now() / 1000) + expDays * 24 * 60 * 60

  const ip = req.headers.get('x-forwarded-for') || undefined
  const ua = req.headers.get('user-agent') || undefined

  try {
    await xuiApi.createUser({
      username,
      password,
      exp_date: expDate,
      bouquet,
      max_connections: maxConnections,
      is_trial: isTrial ? 1 : 0,
    })

    await audit({
      userId: user.id,
      action: 'CLIENT_CREATED',
      entityType: 'CLIENT',
      dataAfter: { username, expDays, isTrial },
      ipAddress: ip,
      userAgent: ua,
    })

    // Invalidar cache da lista
    await cacheDel(`clients:list:${user.id}:1:50::all`)

    return NextResponse.json({ success: true, message: `Cliente ${username} criado com sucesso!` }, { status: 201 })
  } catch (err) {
    console.error('Error creating client:', err)
    return NextResponse.json({ error: 'Erro ao criar cliente no XUI' }, { status: 500 })
  }
}
