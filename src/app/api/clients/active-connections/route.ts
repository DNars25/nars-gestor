import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { xuiQuery } from '@/lib/xui-db'
import { cacheGet, cacheSet } from '@/lib/redis'

export const dynamic = 'force-dynamic'

interface ActiveConnection {
  user_id: number
  username: string
  stream_id: number
  stream_name: string
  user_ip: string
  user_agent: string
  date_start: number
  duration_seconds: number
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const cacheKey = `clients:active_connections`
  const cached = await cacheGet(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const connections = await xuiQuery<ActiveConnection>(
      `SELECT ua.user_id, u.username, ua.stream_id, s.stream_display_name as stream_name,
              ua.user_ip, ua.user_agent, ua.date_start,
              UNIX_TIMESTAMP() - ua.date_start as duration_seconds
       FROM user_activity ua
       LEFT JOIN users u ON u.id = ua.user_id
       LEFT JOIN streams s ON s.id = ua.stream_id
       WHERE ua.date_start > UNIX_TIMESTAMP() - 300
       ORDER BY ua.date_start DESC
       LIMIT 200`
    )

    await cacheSet(cacheKey, connections, 5)
    return NextResponse.json(connections)
  } catch (err) {
    console.error('Error fetching active connections:', err)
    return NextResponse.json({ error: 'Erro ao buscar conexões ativas' }, { status: 500 })
  }
}
