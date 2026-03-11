import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { xuiQuery } from '@/lib/xui-db'
import { prisma } from '@/lib/prisma'
import { cacheGet, cacheSet } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const cacheKey = `dashboard:stats:${user.id}`
  const cached = await cacheGet(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    // Totais do XUI
    const [totalClients] = await xuiQuery<{ total: number }>(
      'SELECT COUNT(*) as total FROM users WHERE admin_enabled = 1'
    )

    const [activeClients] = await xuiQuery<{ total: number }>(
      'SELECT COUNT(*) as total FROM users WHERE admin_enabled = 1 AND enabled = 1'
    )

    const [trialClients] = await xuiQuery<{ total: number }>(
      'SELECT COUNT(*) as total FROM users WHERE admin_enabled = 1 AND is_trial = 1 AND enabled = 1'
    )

    // Conexões ativas agora
    const [onlineNow] = await xuiQuery<{ total: number }>(
      `SELECT COUNT(DISTINCT user_id) as total FROM user_activity
       WHERE date_start > UNIX_TIMESTAMP() - 300`
    )

    // Clientes expirando em 7 dias
    const sevenDaysMs = Date.now() + 7 * 24 * 60 * 60 * 1000
    const [expiringClients] = await xuiQuery<{ total: number }>(
      `SELECT COUNT(*) as total FROM users
       WHERE admin_enabled = 1 AND enabled = 1
       AND exp_date > 0 AND exp_date < ?`,
      [sevenDaysMs]
    )

    // Novos clientes nos últimos 30 dias (gráfico)
    const newClientsChart = await xuiQuery<{ date: string; count: number }>(
      `SELECT DATE(FROM_UNIXTIME(created_at/1000)) as date, COUNT(*) as count
       FROM users
       WHERE admin_enabled = 1 AND created_at > UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 30 DAY)) * 1000
       GROUP BY date ORDER BY date ASC`
    )

    // Dados do painel próprio
    const mastersCount = await prisma.user.count({ where: { role: 'MASTER', status: 'ATIVO' } })
    const revendasCount = await prisma.user.count({ where: { role: 'REVENDA', status: 'ATIVO' } })

    const stats = {
      totalClients: totalClients.total,
      activeClients: activeClients.total,
      trialClients: trialClients.total,
      onlineNow: onlineNow.total,
      expiringClients: expiringClients.total,
      mastersCount,
      revendasCount,
      newClientsChart,
    }

    await cacheSet(cacheKey, stats, 30)
    return NextResponse.json(stats)
  } catch (err) {
    console.error('Dashboard stats error:', err)
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
  }
}
