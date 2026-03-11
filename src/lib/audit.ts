import { prisma } from './prisma'

export async function audit(params: {
  userId: string
  action: string
  entityType?: string
  entityId?: string
  dataBefore?: unknown
  dataAfter?: unknown
  ipAddress?: string
  userAgent?: string
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      dataBefore: params.dataBefore ? JSON.stringify(params.dataBefore) : undefined,
      dataAfter: params.dataAfter ? JSON.stringify(params.dataAfter) : undefined,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  })
}
