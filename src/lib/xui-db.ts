import mysql from 'mysql2/promise'

let xuiPool: mysql.Pool | null = null

export function getXuiPool(): mysql.Pool {
  if (!xuiPool) {
    xuiPool = mysql.createPool({
      uri: process.env.XUI_DB_URL,
      connectionLimit: 5,
      waitForConnections: true,
      queueLimit: 0,
      connectTimeout: 10000,
    })
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

// Tipos do banco XUI
export interface XuiUser {
  id: number
  username: string
  password: string
  exp_date: number | null
  enabled: number
  admin_enabled: number
  reseller_id: number | null
  created_at: number
  max_connections: number
  is_trial: number
  bouquet: string
  user_note: string | null
}

export interface XuiUserActivity {
  user_id: number
  stream_id: number
  server_id: number
  user_ip: string
  user_agent: string
  date_start: number
}

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
