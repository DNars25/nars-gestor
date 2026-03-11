import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as argon2 from 'argon2'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/redis'
import { audit } from '@/lib/audit'

const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const userAgent = req.headers.get('user-agent') || ''

  // Rate limiting: 5 tentativas por 15 minutos por IP
  const rl = await checkRateLimit(`login:${ip}`, 5, 900)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde 15 minutos.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.resetAt - Math.floor(Date.now() / 1000)) },
      }
    )
  }

  const body = await req.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { username, password } = parsed.data

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      passwordHash: true,
      role: true,
      status: true,
      twoFactorEnabled: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }

  if (user.status === 'BLOQUEADO') {
    return NextResponse.json({ error: 'Conta bloqueada. Entre em contato com o suporte.' }, { status: 403 })
  }

  const validPassword = await argon2.verify(user.passwordHash, password)
  if (!validPassword) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }

  // 2FA obrigatório para ADMIN e INVESTIDOR
  if (user.twoFactorEnabled && (user.role === 'ADMIN' || user.role === 'INVESTIDOR')) {
    return NextResponse.json({
      requiresTwoFactor: true,
      userId: user.id,
    })
  }

  const { accessToken, refreshToken } = await createSession(user.id, ip, userAgent)

  // Atualizar last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), lastLoginIp: ip },
  })

  await audit({
    userId: user.id,
    action: 'USER_LOGIN',
    ipAddress: ip,
    userAgent,
  })

  const response = NextResponse.json({
    accessToken,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  })

  response.cookies.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })

  return response
}
