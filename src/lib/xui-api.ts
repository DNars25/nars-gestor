import { xuiQuery, xuiExecute } from '@/lib/xui-db'
import type { XuiLine } from '@/lib/xui-db'

// Normaliza bouquet para JSON array string ex: "1" → '["1"]', '["1"]' → '["1"]'
function normalizeBouquet(bouquet: string): string {
  try {
    const parsed = JSON.parse(bouquet)
    if (Array.isArray(parsed)) return bouquet
  } catch {
    // não é JSON — tratar como ID simples
  }
  return JSON.stringify([bouquet])
}

export interface XuiCreateLinePayload {
  username: string
  password: string
  exp_date: number // Unix timestamp em segundos
  bouquet: string
  max_connections: number
  is_trial?: number
  member_id?: number
}

export interface XuiUpdateLinePayload {
  id: number
  username?: string
  password?: string
  exp_date?: number
  enabled?: number
  max_connections?: number
  bouquet?: string
  member_id?: number
}

// Aliases de compatibilidade
export type XuiCreateUserPayload = XuiCreateLinePayload
export type XuiUpdateUserPayload = XuiUpdateLinePayload

export const xuiApi = {
  async createUser(payload: XuiCreateLinePayload) {
    const nowSec = Math.floor(Date.now() / 1000)
    const bouquet = normalizeBouquet(payload.bouquet)

    const result = await xuiExecute(
      `INSERT INTO \`lines\`
        (username, password, exp_date, enabled, admin_enabled, max_connections, is_trial, bouquet, member_id, created_at)
       VALUES (?, ?, ?, 1, 1, ?, ?, ?, ?, ?)`,
      [
        payload.username,
        payload.password,
        payload.exp_date,
        payload.max_connections,
        payload.is_trial ?? 0,
        bouquet,
        payload.member_id ?? 1,
        nowSec,
      ]
    )

    return { id: result.insertId, username: payload.username }
  },

  async updateUser(payload: XuiUpdateLinePayload) {
    const sets: string[] = []
    const params: (string | number | boolean | null)[] = []

    if (payload.username !== undefined) { sets.push('username = ?'); params.push(payload.username) }
    if (payload.password !== undefined) { sets.push('password = ?'); params.push(payload.password) }
    if (payload.exp_date !== undefined) { sets.push('exp_date = ?'); params.push(payload.exp_date) }
    if (payload.enabled !== undefined) { sets.push('enabled = ?'); params.push(payload.enabled) }
    if (payload.max_connections !== undefined) { sets.push('max_connections = ?'); params.push(payload.max_connections) }
    if (payload.bouquet !== undefined) { sets.push('bouquet = ?'); params.push(normalizeBouquet(payload.bouquet)) }
    if (payload.member_id !== undefined) { sets.push('member_id = ?'); params.push(payload.member_id) }

    if (sets.length === 0) return { success: true }

    params.push(payload.id)
    await xuiExecute(`UPDATE \`lines\` SET ${sets.join(', ')} WHERE id = ?`, params)
    return { success: true }
  },

  async deleteUser(id: number) {
    await xuiExecute('DELETE FROM `lines` WHERE id = ?', [id])
    return { success: true }
  },

  async blockUser(id: number) {
    await xuiExecute('UPDATE `lines` SET enabled = 0 WHERE id = ?', [id])
    return { success: true }
  },

  async unblockUser(id: number) {
    await xuiExecute('UPDATE `lines` SET enabled = 1 WHERE id = ?', [id])
    return { success: true }
  },

  async renewUser(id: number, newExpDate: number) {
    await xuiExecute('UPDATE `lines` SET exp_date = ? WHERE id = ?', [newExpDate, id])
    return { success: true }
  },
}

// Verificar se username já está em uso (read-only)
export async function checkUsernameExists(username: string): Promise<boolean> {
  const rows = await xuiQuery<Pick<XuiLine, 'id'>>('SELECT id FROM `lines` WHERE username = ?', [username])
  return rows.length > 0
}
