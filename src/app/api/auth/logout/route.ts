import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { audit } from '@/lib/audit'

export async function POST(req: NextRequest) {
  const payload = await getSessionFromRequest(req)

  if (payload) {
    // Revogar sessão atual
    await prisma.session.updateMany({
      where: { userId: payload.sub, revokedAt: null },
      data: { revokedAt: new Date() },
    })

    await audit({
      userId: payload.sub,
      action: 'USER_LOGOUT',
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
    })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.delete('refresh_token')
  return response
}
