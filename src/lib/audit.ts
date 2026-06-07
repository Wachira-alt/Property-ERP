// @ts-nocheck
import { prisma } from "@/lib/prisma"
import type { SessionUser } from "@/types/auth"

export type AuditAction =
  // Auth
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "OTP_SENT"
  | "OTP_FAILED"
  // Users
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_DEACTIVATED"
  | "USER_PASSWORD_RESET"
  // Contacts
  | "CONTACT_CREATED"
  | "CONTACT_UPDATED"
  | "CONTACT_DELETED"
  | "NOTE_ADDED"
  | "UNIT_ASSIGNED"
  // Pipeline
  | "STAGE_MOVED_TO_AMBER"
  | "STAGE_MOVED_TO_CLOSED"
  | "STAGE_MOVED_TO_PAST"
  | "STAGE_EXPIRED"
  | "STAGE_CANCELLED"
  | "RESERVATION_EXTENDED"
  // Inventory
  | "PROJECT_CREATED"
  | "UNIT_TYPE_CREATED"
  | "UNIT_CREATED"
  | "UNIT_STATUS_CHANGED"
  // Finance
  | "LEDGER_ENTRY_CREATED"
  | "LEDGER_ENTRY_DELETED"
  | "PAYMENT_MARKED_PAID"
  // Documents
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_DELETED"
  // Campaigns
  | "CAMPAIGN_CREATED"
  | "CAMPAIGN_SENT"

export type AuditEntityType =
  | "USER"
  | "CONTACT"
  | "OPPORTUNITY"
  | "UNIT"
  | "PROJECT"
  | "LEDGER_ENTRY"
  | "DOCUMENT"
  | "CAMPAIGN"
  | "AUTH"

type AuditParams = {
  action:     AuditAction
  entityType: AuditEntityType
  entityId:   string
  actor:      SessionUser
  metadata?:  Record<string, any>
  ipAddress?: string
}

export async function audit({
  action,
  entityType,
  entityId,
  actor,
  metadata,
  ipAddress,
}: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        actorId:   actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        metadata:  metadata ?? null,
        ipAddress: ipAddress ?? null,
      },
    })
  } catch (err) {
    // Audit must never break the main flow
    console.error("[audit] Failed to write audit log:", err)
  }
}

// Standalone version for auth routes (no session object)
export async function auditAuth(data: {
  action:     AuditAction
  entityId:   string
  actorId?:   string
  actorName:  string
  actorRole:  string
  metadata?:  Record<string, any>
  ipAddress?: string
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action:     data.action,
        entityType: "AUTH",
        entityId:   data.entityId,
        actorId:    data.actorId ?? null,
        actorName:  data.actorName,
        actorRole:  data.actorRole,
        metadata:   data.metadata ?? null,
        ipAddress:  data.ipAddress ?? null,
      },
    })
  } catch (err) {
    console.error("[audit] Failed to write auth audit log:", err)
  }
}