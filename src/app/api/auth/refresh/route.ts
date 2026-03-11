import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/auth'
import type { JwtPayload } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get('refresh_token')?.value

  if (!refreshToken) {
    return NextResponse.json({ error: 'Refresh token não encontrado' }, { status: 401 })
  }

  try {
    const payload = verifyRefreshToken(refreshToken)

    const session = await prisma.session.findUnique({
      where: { refreshToken },
    })

    if (!session || session.revokedAt || session.refreshExpiresAt < new Date()) {
      return NextResponse.json({ error: 'Sessão inválida ou expirada' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, username: true, role: true, status: true },
    })

    if (!user || user.status === 'BLOQUEADO') {
      return NextResponse.json({ error: 'Usuário inativo' }, { status: 401 })
    }

    // Rotação do refresh token
    const newAccessToken = signAccessToken({
      sub: user.id,
      username: user.username,
      role: user.role,
      sessionId: session.id,
    } as JwtPayload)

    const newRefreshToken = signRefreshToken({ sub: user.id, sessionId: session.id })

    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        refreshExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    const response = NextResponse.json({
      accessToken: newAccessToken,
      user: { id: user.id, username: user.username, role: user.role },
    })

    response.cookies.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }
}
