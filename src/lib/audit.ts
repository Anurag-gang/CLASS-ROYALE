import { prisma } from "./db";

export interface AuditLogParams {
  actorId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, any>;
  ipAddress?: string | null;
}

export async function recordAuditLog({
  actorId,
  action,
  targetType,
  targetId,
  metadata,
  ipAddress,
}: AuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actorId || null,
        action,
        targetType,
        targetId: targetId || null,
        metadataJson: metadata ? JSON.stringify(metadata) : null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    console.error("Failed to record audit log:", err);
  }
}
