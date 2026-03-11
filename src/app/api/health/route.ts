import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getXuiPool } from '@/lib/xui-db'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function GET() {
  const results: Record<string, { status: 'ok' | 'error'; latency?: number; error?: string }> = {}
  const start = Date.now()

  // Check Prisma / nars_painel DB
  try {
    const t = Date.now()
    await prisma.$queryRaw`SELECT 1`
    results.database_painel = { status: 'ok', latency: Date.now() - t }
  } catch (e) {
    results.database_painel = { status: 'error', error: String(e) }
  }

  // Check XUI DB
  try {
    const t = Date.now()
    const pool = getXuiPool()
    await pool.execute('SELECT 1')
    results.database_xui = { status: 'ok', latency: Date.now() - t }
  } catch (e) {
    results.database_xui = { status: 'error', error: String(e) }
  }

  // Check Redis
  try {
    const t = Date.now()
    await redis.ping()
    results.redis = { status: 'ok', latency: Date.now() - t }
  } catch (e) {
    results.redis = { status: 'error', error: String(e) }
  }

  const allOk = Object.values(results).every(r => r.status === 'ok')

  return NextResponse.json({
    status: allOk ? 'healthy' : 'degraded',
    services: results,
    totalLatency: Date.now() - start,
    timestamp: new Date().toISOString(),
  }, { status: allOk ? 200 : 207 })
}
