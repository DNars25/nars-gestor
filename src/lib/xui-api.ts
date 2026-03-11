import axios, { AxiosInstance } from 'axios'

const XUI_API_URL = process.env.XUI_API_URL || 'http://127.0.0.1:8181'
const XUI_API_USER = process.env.XUI_API_USER || 'nars_admin'
const XUI_API_PASS = process.env.XUI_API_PASS || 'XuiPass2024x'

let sessionCookie: string | null = null
let lastLoginAt: number = 0
const SESSION_TTL = 20 * 60 * 1000 // 20 minutos

const xuiClient: AxiosInstance = axios.create({
  baseURL: XUI_API_URL,
  timeout: 10000,
  withCredentials: true,
})

async function login(): Promise<void> {
  const res = await xuiClient.post('/login', {
    username: XUI_API_USER,
    password: XUI_API_PASS,
  })

  const setCookie = res.headers['set-cookie']
  if (setCookie && setCookie.length > 0) {
    sessionCookie = setCookie[0].split(';')[0]
    lastLoginAt = Date.now()
  } else {
    throw new Error('XUI API: falha no login, cookie não retornado')
  }
}

async function ensureSession(): Promise<void> {
  const isExpired = Date.now() - lastLoginAt > SESSION_TTL
  if (!sessionCookie || isExpired) {
    await login()
  }
}

async function xuiRequest<T = unknown>(
  method: 'GET' | 'POST',
  endpoint: string,
  data?: Record<string, unknown>
): Promise<T> {
  await ensureSession()

  try {
    const res = await xuiClient.request({
      method,
      url: endpoint,
      data,
      headers: {
        Cookie: sessionCookie!,
        'Content-Type': 'application/json',
      },
    })
    return res.data as T
  } catch (err: unknown) {
    // 401 → re-login e retry
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      sessionCookie = null
      await login()
      const res = await xuiClient.request({
        method,
        url: endpoint,
        data,
        headers: {
          Cookie: sessionCookie!,
          'Content-Type': 'application/json',
        },
      })
      return res.data as T
    }
    throw err
  }
}

// ========================
// API PÚBLICA DO XUI
// ========================

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
    return xuiRequest('POST', '/api/line/create', payload as unknown as Record<string, unknown>)
  },

  async updateUser(payload: XuiUpdateLinePayload) {
    return xuiRequest('POST', '/api/line/update', payload as unknown as Record<string, unknown>)
  },

  async deleteUser(id: number) {
    return xuiRequest('POST', '/api/line/delete', { id })
  },

  async blockUser(id: number) {
    return xuiRequest('POST', '/api/line/update', { id, enabled: 0 })
  },

  async unblockUser(id: number) {
    return xuiRequest('POST', '/api/line/update', { id, enabled: 1 })
  },

  async renewUser(id: number, newExpDate: number) {
    return xuiRequest('POST', '/api/line/update', { id, exp_date: newExpDate })
  },

  async getServerStats() {
    return xuiRequest('GET', '/server/stats')
  },
}
