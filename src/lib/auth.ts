import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import type { UserRole } from '@/generated/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'change-me'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'change-me-refresh'

const ACCESS_TOKEN_TTL = '15m'
const REFRESH_TOKEN_TTL = '7d'
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

export interface JwtPayload {
  sub: string      // userId
  username: string
  role: UserRole
  sessionId: string
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL })
}

export function signRefreshToken(payload: Pick<JwtPayload, 'sub' | 'sessionId'>): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL })
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}

export function verifyRefreshToken(token: string): Pick<JwtPayload, 'sub' | 'sessionId'> {
  return jwt.verify(token, JWT_REFRESH_SECRET) as Pick<JwtPayload, 'sub' | 'sessionId'>
}

export async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const session = await prisma.session.create({
    data: {
      userId,
      token: '',
      refreshToken: '',
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      refreshExpiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  })

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('Usuário não encontrado')

  const payload: JwtPayload = {
    sub: userId,
    username: user.username,
    role: user.role,
    sessionId: session.id,
  }

  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken({ sub: userId, sessionId: session.id })

  await prisma.session.update({
    where: { id: session.id },
    data: { token: accessToken, refreshToken },
  })

  return { accessToken, refreshToken }
}

export async function getSessionFromRequest(request: Request): Promise<JwtPayload | null> {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) return null

  try {
    const payload = verifyAccessToken(token)
    const session = await prisma.session.findUnique({
      where: { token },
    })
    if (!session || session.revokedAt || session.expiresAt < new Date()) return null
    return payload
  } catch {
    return null
  }
}

export async function getCurrentUser(request: Request) {
  const payload = await getSessionFromRequest(request)
  if (!payload) return null

  return prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      status: true,
      credits: true,
      parentId: true,
      twoFactorEnabled: true,
      customDns: true,
      customDnsActive: true,
    },
  })
}

export function setRefreshTokenCookie(refreshToken: string): void {
  // Usado apenas em API routes — via NextResponse
}
