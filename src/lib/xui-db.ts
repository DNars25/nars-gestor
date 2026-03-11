import mysql from 'mysql2/promise'

let xuiPool: mysql.Pool | null = null

export function getXuiPool(): mysql.Pool {
  if (!xuiPool) {
    const url = process.env.XUI_DB_URL
    if (!url) throw new Error('XUI_DB_URL não configurado no .env')
    // mysql2 aceita URI como string direta — NÃO usar { uri: string } (não suportado)
    xuiPool = mysql.createPool(url)
  }
  return xuiPool
}

export async function xuiQuery<T = unknown>(
  sql: string,
  params?: (string | number | boolean | null)[]
): Promise<T[]> {
  const pool = getXuiPool()
  const [rows] = await pool.execute(sql, params)
  return rows as T[]
}

// Tipos do banco XUI — tabela `lines` (clientes IPTV)
export interface XuiLine {
  id: number
  username: string
  password: string
  exp_date: number | null       // Unix timestamp em segundos (0 = sem expiração)
  enabled: number
  admin_enabled: number
  member_id: number | null      // ID do revendedor dono da linha
  created_at: number            // Unix timestamp em segundos
  max_connections: number
  is_trial: number
  bouquet: string               // JSON mediumtext com IDs de bouquets
  admin_notes: string | null
  reseller_notes: string | null
  contact: string | null
  last_activity: number | null
}

export interface XuiLineActivity {
  line_id: number
  stream_id: number
  server_id: number
  user_ip: string
  user_agent: string
  date_start: number
}

// Alias de compatibilidade — remover após refatoração completa
export type XuiUser = XuiLine

export interface XuiStream {
  id: number
  stream_display_name: string
  type: string
  category_id: number
  added: number
}

export interface XuiRegUser {
  id: number
  username: string
  password: string
  credits: number
  owner_id: number
  status: number
  created_at: number
}

export interface XuiBouquet {
  id: number
  bouquet_name: string
  bouquet_channels: string
  bouquet_series: string
  bouquet_movies: string
}
