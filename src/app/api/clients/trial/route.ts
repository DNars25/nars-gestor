import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { xuiQuery } from '@/lib/xui-db'
import { xuiApi } from '@/lib/xui-api'
import { audit } from '@/lib/audit'
import type { XuiLine } from '@/lib/xui-db'

const trialSchema = z.object({
  packageType: z.enum(['COMPLETO', 'SEM_ADULTO']).default('COMPLETO'),
  serviceType: z.enum(['IPTV', 'P2P']).default('IPTV'),
  durationHours: z.number().int().min(1).max(72).default(24),
})

function generateTrialCredentials() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const rand = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return {
    username: `test_${rand(6)}`,
    password: rand(10),
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const parsed = trialSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { packageType, serviceType, durationHours } = parsed.data

  // Bouquet baseado no tipo de pacote (simplificado — ID real deve ser consultado no XUI)
  const bouquetMap: Record<string, string> = {
    COMPLETO: '1',
    SEM_ADULTO: '2',
  }

  const { username, password } = generateTrialCredentials()
  const expDate = Math.floor(Date.now() / 1000) + durationHours * 60 * 60

  // Garantir username único
  const existing = await xuiQuery<XuiLine>('SELECT id FROM lines WHERE username = ?', [username])
  if (existing.length > 0) {
    return NextResponse.json({ error: 'Tente novamente' }, { status: 409 })
  }

  try {
    await xuiApi.createUser({
      username,
      password,
      exp_date: expDate,
      bouquet: bouquetMap[packageType] || '1',
      max_connections: 1,
      is_trial: 1,
    })

    await audit({
      userId: user.id,
      action: 'TRIAL_CREATED',
      entityType: 'CLIENT',
      dataAfter: { username, packageType, serviceType, durationHours },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({
      success: true,
      username,
      password,
      expDate,
      durationHours,
      message: `Teste criado! Você pode editar o usuário e a senha a qualquer momento.`,
    }, { status: 201 })
  } catch (err) {
    console.error('Error creating trial:', err)
    return NextResponse.json({ error: 'Erro ao criar teste' }, { status: 500 })
  }
}
